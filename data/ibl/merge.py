import pandas as pd


main = pd.read_csv("ibl_probe_labels.csv")
eids = pd.read_csv("ibl_bwm_pids.csv")

# Build pid -> eid map and add eid to probe-label rows.
main["eid"] = main["pid"].map(eids.set_index("pid")["eid"])
main["eid"] = main["eid"].fillna("-1")

# Build session groups from eid so every pid in the same eid shares a session id.
# Unknown eid (-1) remains unknown session (-1).
valid = main["eid"] != "-1"
session_ids = pd.Series("-1", index=main.index, dtype="object")
session_ids.loc[valid] = (
    "session_"
    + pd.factorize(main.loc[valid, "eid"], sort=True)[0].astype(str)
)
main["session"] = session_ids

# Keep session grouping stable and easy to inspect.
main = main.sort_values(["session", "eid", "pid", "rawInd"], kind="stable")

main.to_csv("ibl_probe_labels_with_eid.csv", index=False)
