import numpy as np
import h5py
from pathlib import Path
from scipy.signal import butter, sosfiltfilt
import matplotlib.pyplot as plt
import spikeinterface as si
from spikeinterface.preprocessing import bandpass_filter, common_reference


def manual_preprocess(raw, fs):
    """Apply highpass filter and Common Average Reference (CAR).

    Parameters
    ----------
    raw : np.ndarray, shape (n_channels, n_samples)
        Input data
    fs : float
        Sampling rate

    Returns
    -------
    processed : np.ndarray
        Preprocessed data (float32)
    """
    sos_hp = butter(3, 1 / (fs / 2), btype='high', output='sos')
    raw = sosfiltfilt(sos_hp, raw, axis=1)
    raw = raw - raw.mean(axis=0, keepdims=True)  # CAR
    return raw.astype('float32')


def detect_bad_channels(raw, psd_db=None, freqs=None,
                        dead_ratio=0.1, neighbor_radius=10,
                        noisy_threshold_db=3.0):
    """
    Detect bad channels: dead (near-zero variance vs LOCAL neighbors)
    and noisy (high PSD deviation vs local neighbors).

    Uses local comparison so that naturally quiet regions (e.g. outside brain)
    are not falsely flagged — only channels whose variance is dramatically
    lower than their immediate spatial neighbors.

    Parameters
    ----------
    raw : np.ndarray, shape (n_channels, n_samples)
        Time-domain LFP data (after destriping).
    fs : float
        Sampling rate.
    psd_db : np.ndarray, optional
        Pre-computed PSD in dB, shape (n_channels, n_freqs).
    freqs : np.ndarray, optional
        Frequency axis for psd_db.
    dead_ratio : float
        A channel is dead if its variance < dead_ratio * local_median_variance.
    neighbor_radius : int
        Number of channels on each side to use as local neighborhood.
    noisy_threshold_db : float
        Channels whose broadband PSD exceeds local neighbors by this many dB are noisy.

    Returns
    -------
    bad_channels : np.ndarray of int
        Indices of all bad channels (dead + noisy).
    labels : dict
        {'dead': np.ndarray, 'noisy': np.ndarray} with channel indices.
    """
    n_ch = raw.shape[0]
    r = neighbor_radius

    # --- Dead channels: variance << local neighborhood median ---
    ch_var = np.var(raw, axis=1)
    local_median_var = np.array([
        np.median(ch_var[max(0, i - r):min(n_ch, i + r + 1)])
        for i in range(n_ch)
    ])
    # A channel is dead if its variance is a tiny fraction of its neighbors
    dead = np.where(ch_var < dead_ratio * local_median_var)[0]

    # --- Noisy channels: PSD deviates from spatial neighbors ---
    noisy = np.array([], dtype=int)
    if psd_db is not None and freqs is not None:
        broad_mask = (freqs >= 2) & (freqs <= 300)
        broad_power = psd_db[:, broad_mask].mean(axis=1)
        local_mean = np.array([
            np.median(broad_power[max(0, i - r):min(n_ch, i + r + 1)])
            for i in range(n_ch)
        ])
        deviation = broad_power - local_mean
        noisy = np.where(deviation > noisy_threshold_db)[0]

    bad_channels = np.unique(np.concatenate([dead, noisy]))
    return bad_channels, {'dead': dead, 'noisy': noisy}


def interpolate_bad_channels(raw, bad_channels):
    """
    Replace bad channels with the mean of their nearest good neighbors.
    Operates in-place on raw (n_channels, n_samples).
    """
    if len(bad_channels) == 0:
        return raw
    n_ch = raw.shape[0]
    good_mask = np.ones(n_ch, dtype=bool)
    good_mask[bad_channels] = False
    good_indices = np.where(good_mask)[0]

    for bc in bad_channels:
        # Find nearest good channels above and below
        above = good_indices[good_indices < bc]
        below = good_indices[good_indices > bc]
        neighbors = []
        if len(above) > 0:
            neighbors.append(above[-1])   # closest good channel above
        if len(below) > 0:
            neighbors.append(below[0])    # closest good channel below
        if len(neighbors) > 0:
            raw[bc] = raw[neighbors].mean(axis=0)
        # else: no good neighbors (extremely unlikely), leave as-is
    return raw


def load_nwb_data(nwb_path_or_session_id, probe_id=None, time_range=None):
    """Load LFP data from Allen NWB file.

    Parameters
    ----------
    nwb_path_or_session_id : str or Path
        Either: direct path to NWB file, OR session ID (if probe_id provided)
    probe_id : str or int, optional
        Probe ID (only used if nwb_path_or_session_id is a session ID)
    time_range : tuple, optional
        (start_time, end_time) in seconds. If None, loads entire recording.

    Returns
    -------
    data : np.ndarray, shape (n_channels, n_samples)
        LFP data transposed to (channels, samples)
    fs : float
        Sampling rate (1250 Hz for Allen data)
    timestamps : np.ndarray
        Timestamps for the data
    """
    # Handle both direct path and session_id/probe_id inputs
    if probe_id is not None:
        # Use session_id and probe_id format
        SESSION_DATA_DIR = Path(__file__).parent / "session_data" / "sessions"
        nwb_path = SESSION_DATA_DIR / f"session_{nwb_path_or_session_id}" / f"probe_{probe_id}_lfp.nwb"
    else:
        # Use direct path and extract probe_id from filename
        nwb_path = Path(nwb_path_or_session_id)
        # Extract probe_id from filename (probe_XXXXX_lfp.nwb)
        filename = nwb_path.stem  # e.g., "probe_773549848_lfp"
        parts = filename.split('_')
        if len(parts) >= 2 and parts[0] == 'probe':
            probe_id = parts[1]
        else:
            raise ValueError(f"Cannot extract probe_id from filename: {nwb_path.name}")

    if not nwb_path.exists():
        raise FileNotFoundError(f"NWB file not found: {nwb_path}")

    fs = 1250  # Allen sampling rate

    with h5py.File(nwb_path, 'r') as f:
        lfp_data = f['acquisition'][f'probe_{probe_id}_lfp'][f'probe_{probe_id}_lfp_data']['data']
        lfp_timestamps = f['acquisition'][f'probe_{probe_id}_lfp'][f'probe_{probe_id}_lfp_data']['timestamps']

        if time_range is None:
            # Load entire recording
            data = lfp_data[:].astype(np.float32)
            timestamps = lfp_timestamps[:]
        else:
            # Load time range
            start_idx = np.searchsorted(lfp_timestamps, time_range[0])
            end_idx = np.searchsorted(lfp_timestamps, time_range[1])
            data = lfp_data[start_idx:end_idx, :].astype(np.float32)
            timestamps = lfp_timestamps[start_idx:end_idx]

    # Transpose to (channels, samples)
    data = data.T

    return data, fs, timestamps


def destripe_data(data, fs, method='bp_pshift_cmr'):
    """Apply destriping preprocessing using spikeinterface.

    Parameters
    ----------
    data : np.ndarray, shape (n_channels, n_samples)
        Raw LFP data (channels x samples)
    fs : float
        Sampling rate
    method : str
        Destriping method: 'bp_pshift_cmr' (default), 'simple', etc.

    Returns
    -------
    destriped : np.ndarray, shape (n_channels, n_samples)
        Destriped data
    """
    # Create recording
    rec = si.NumpyRecording(data, sampling_frequency=fs)

    # Bandpass filter 1-300 Hz
    rec_filtered = bandpass_filter(rec, freq_min=1., freq_max=300., dtype='float32')

    if method == 'bp_pshift_cmr':
        # Phase shift alignment
        from spikeinterface.preprocessing import phase_shift
        inter_sample_shift = np.zeros(rec_filtered.get_num_channels())
        rec_filtered.set_property('inter_sample_shift', inter_sample_shift)
        rec_pshift = phase_shift(rec_filtered)
        rec_preprocessed = common_reference(rec_pshift, reference='global', operator='median')
    else:  # 'simple'
        rec_preprocessed = common_reference(rec_filtered, reference='global', operator='median')

    return rec_preprocessed.get_traces()


def process_allen_lfp(nwb_path_or_session_id, probe_id=None, time_range=None, destripe_method='bp_pshift_cmr',
                      detect_bad=True, interpolate_bad=True, verbose=True):
    """Complete pipeline: load → destripe → detect bad channels → interpolate → preprocess.

    Parameters
    ----------
    nwb_path_or_session_id : str or Path
        Either: direct path to NWB file, OR session ID (if probe_id provided)
    probe_id : str or int, optional
        Probe ID (only used if nwb_path_or_session_id is a session ID)
    time_range : tuple, optional
        (start_time, end_time) in seconds
    destripe_method : str
        Destriping method ('bp_pshift_cmr' or 'simple')
    detect_bad : bool
        Whether to detect bad channels
    interpolate_bad : bool
        Whether to interpolate bad channels
    verbose : bool
        Print status messages

    Returns
    -------
    processed : np.ndarray, shape (n_channels, n_samples)
        Fully preprocessed data (channels x samples)
    bad_channels : np.ndarray
        Indices of detected bad channels
    labels : dict
        Bad channel labels {'dead': array, 'noisy': array}
    """
    # Get display name
    if probe_id is not None:
        display_name = f"probe {probe_id} from session {nwb_path_or_session_id}"
    else:
        display_name = str(nwb_path_or_session_id)

    if verbose:
        print(f"\n{'='*70}")
        print(f"Processing {display_name}")
        print(f"{'='*70}")

    # Load NWB data
    if verbose:
        print(f"\n[1/5] Loading NWB data...")
    data, fs, _ = load_nwb_data(nwb_path_or_session_id, probe_id, time_range)
    if verbose:
        print(f"  Loaded: {data.shape[0]} channels × {data.shape[1]} samples")
        print(f"  Sampling rate: {fs} Hz")

    # Apply destriping (includes bandpass + CMR)
    if verbose:
        print(f"\n[2/5] Applying destriping ({destripe_method})...")
    destriped = destripe_data(data, fs, method=destripe_method)
    if verbose:
        print(f"  ✓ Destriping complete")

    bad_channels = np.array([], dtype=int)
    labels = {'dead': np.array([], dtype=int), 'noisy': np.array([], dtype=int)}

    # Detect bad channels
    if detect_bad:
        if verbose:
            print(f"\n[3/5] Detecting bad channels...")
        bad_channels, labels = detect_bad_channels(destriped)
        if verbose:
            print(f"  Dead channels: {labels['dead']}")
            print(f"  Noisy channels: {labels['noisy']}")
            print(f"  Total bad channels: {len(bad_channels)}")
    else:
        if verbose:
            print(f"\n[3/5] Skipping bad channel detection")

    # Interpolate bad channels
    if interpolate_bad and len(bad_channels) > 0:
        if verbose:
            print(f"\n[4/5] Interpolating {len(bad_channels)} bad channels...")
        destriped = interpolate_bad_channels(destriped, bad_channels)
        if verbose:
            print(f"  ✓ Interpolation complete")
    else:
        if verbose:
            if len(bad_channels) == 0:
                print(f"\n[4/5] No bad channels to interpolate")
            else:
                print(f"\n[4/5] Skipping interpolation")

    # Apply final preprocessing (highpass + CAR)
    if verbose:
        print(f"\n[5/5] Applying final preprocessing...")
    processed = manual_preprocess(destriped, fs)
    if verbose:
        print(f"  ✓ Preprocessing complete")
        print(f"\n{'='*70}")
        print(f"✓ Processing complete")
        print(f"{'='*70}\n")

    return processed, bad_channels, labels


def plot_processed_heatmap(processed_data, output_path, v_limit=None, fs=1250):
    """
    Plot processed LFP data as a heatmap and save to file.

    Parameters
    ----------
    processed_data : np.ndarray, shape (n_channels, n_samples)
        Processed LFP data from process_allen_lfp()
    output_path : str or Path
        Path to save the heatmap image
    v_limit : float, optional
        Symmetric color scale limit (vmin=-v_limit, vmax=v_limit).
        If None, uses 3x the standard deviation of the data.
    fs : float, optional
        Sampling rate in Hz (default: 1250 Hz for Allen data)
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if v_limit is None:
        v_limit = 3 * np.std(processed_data)

    n_channels, n_samples = processed_data.shape
    duration_s = n_samples / fs

    fig, ax = plt.subplots(figsize=(12, 7))
    ax.imshow(processed_data, aspect='auto', cmap='RdBu_r',
              origin='lower', vmin=-v_limit, vmax=v_limit,
              extent=[0, duration_s, 0, n_channels])

    # Labels and ticks
    ax.set_xlabel('Time (s)', fontsize=12)
    ax.set_ylabel('Channel #', fontsize=12)
    ax.set_yticks(np.linspace(0, n_channels, 5))
    ax.set_yticklabels([f'{int(y)}' for y in np.linspace(0, n_channels - 1, 5)])

    plt.tight_layout()
    fig.savefig(output_path, dpi=150, bbox_inches='tight')
    plt.close(fig)
    print(f"Saved heatmap: {output_path}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Process Allen LFP data with bad channel detection.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Using session ID and probe ID
  python amplitude_map.py 768515987 773549848 --save-heatmap

  # Using direct NWB file path
  python amplitude_map.py /path/to/probe_773549848_lfp.nwb --save-heatmap

  # Process all probes in a folder
  python amplitude_map.py /path/to/session_folder/ --save-heatmap

  # Dry run (preview what would be processed)
  python amplitude_map.py /path/to/session_folder/ --dry-run

  # Process 5 seconds only
  python amplitude_map.py 768515987 773549848 --time-range 0 5
        """)

    parser.add_argument("input", type=str,
                        help="Session ID, NWB file path, or folder with NWB files")
    parser.add_argument("probe_id", nargs='?', type=str,
                        help="Probe ID - omit if using NWB file/folder path")
    parser.add_argument("--time-range", nargs=2, type=float, help="Time range (start_s end_s)")
    parser.add_argument("--destripe", choices=["bp_pshift_cmr", "simple"], default="bp_pshift_cmr",
                        help="Destriping method (default: bp_pshift_cmr)")
    parser.add_argument("--no-detect-bad", action="store_true", help="Skip bad channel detection")
    parser.add_argument("--no-interpolate", action="store_true", help="Skip bad channel interpolation")
    parser.add_argument("--save-heatmap", action="store_true", help="Save heatmap visualization of processed data")
    parser.add_argument("--dry-run", action="store_true", help="Preview probes to process without running")

    args = parser.parse_args()

    time_range = tuple(args.time_range) if args.time_range else None
    input_path = Path(args.input)

    # Determine input type
    if input_path.is_dir():
        # Folder: find all probe_*_lfp.nwb files
        nwb_files = sorted(input_path.glob("probe_*_lfp.nwb"))

        if not nwb_files:
            print(f"Error: No probe_*_lfp.nwb files found in {input_path}")
            exit(1)

        print(f"\nFound {len(nwb_files)} probe(s) in {input_path}")

        if args.dry_run:
            print("\n📋 Dry run - probes to process:")
            for i, nwb in enumerate(nwb_files, 1):
                print(f"  {i}. {nwb.name}")
            exit(0)

        # Process all probes
        results = []
        print(f"\n{'='*70}")
        print(f"Processing {len(nwb_files)} probes")
        print(f"{'='*70}")

        for i, nwb_path in enumerate(nwb_files, 1):
            print(f"\n[{i}/{len(nwb_files)}] Processing {nwb_path.name}...")
            try:
                processed, bad_ch, labels = process_allen_lfp(
                    str(nwb_path), None,
                    time_range=time_range,
                    destripe_method=args.destripe,
                    detect_bad=not args.no_detect_bad,
                    interpolate_bad=not args.no_interpolate,
                    verbose=False
                )

                print(f"  ✓ Output shape: {processed.shape}")
                print(f"  Bad channels: {len(bad_ch)}")

                if args.save_heatmap:
                    heatmap_dir = Path(__file__).parent / "public" / "amplitude_heatmaps"
                    heatmap_name = nwb_path.stem
                    heatmap_path = heatmap_dir / f"{heatmap_name}_processed.png"
                    plot_processed_heatmap(processed, heatmap_path, fs=1250)

                results.append({'probe': nwb_path.name, 'status': 'success', 'shape': processed.shape, 'bad_ch': len(bad_ch)})

            except Exception as e:
                print(f"  ❌ Error: {e}")
                results.append({'probe': nwb_path.name, 'status': 'failed', 'error': str(e)})

        # Summary
        print(f"\n{'='*70}")
        print("SUMMARY")
        print(f"{'='*70}")
        success_count = sum(1 for r in results if r['status'] == 'success')
        print(f"✓ Processed: {success_count}/{len(results)}")

        for r in results:
            if r['status'] == 'success':
                print(f"  {r['probe']}: {r['shape']} ({r['bad_ch']} bad channels)")
            else:
                print(f"  {r['probe']}: FAILED - {r['error']}")

    elif args.input.endswith('.nwb') or input_path.is_file():
        # Single NWB file
        processed, bad_ch, labels = process_allen_lfp(
            args.input, args.probe_id,
            time_range=time_range,
            destripe_method=args.destripe,
            detect_bad=not args.no_detect_bad,
            interpolate_bad=not args.no_interpolate,
            verbose=True
        )

        print(f"Output shape: {processed.shape} (channels × samples)")

        if args.save_heatmap:
            heatmap_dir = Path(__file__).parent / "public" / "amplitude_heatmaps"
            heatmap_name = Path(args.input).stem
            heatmap_path = heatmap_dir / f"{heatmap_name}_processed.png"
            plot_processed_heatmap(processed, heatmap_path, fs=1250)
            print(f"\nHeatmap saved to: {heatmap_path}")

    else:
        # Session ID + Probe ID format
        if args.probe_id is None:
            print("Error: probe_id required when using session ID")
            exit(1)

        processed, bad_ch, labels = process_allen_lfp(
            args.input, args.probe_id,
            time_range=time_range,
            destripe_method=args.destripe,
            detect_bad=not args.no_detect_bad,
            interpolate_bad=not args.no_interpolate,
            verbose=True
        )

        print(f"Output shape: {processed.shape} (channels × samples)")

        if args.save_heatmap:
            heatmap_dir = Path(__file__).parent / "public" / "amplitude_heatmaps"
            heatmap_path = heatmap_dir / f"{args.input}_{args.probe_id}_processed.png"
            plot_processed_heatmap(processed, heatmap_path, fs=1250)
            print(f"\nHeatmap saved to: {heatmap_path}")
