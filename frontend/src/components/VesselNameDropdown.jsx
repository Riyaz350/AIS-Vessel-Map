import { useMemo, useState, useRef, useEffect } from "react";

export default function VesselNameDropdown({
  vessels,
  selectedMmsi,
  onSelect,
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const namedVessels = useMemo(() => {
    return vessels
      .filter(
        (v) =>
          v.name &&
          v.name.trim().length > 0
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );
  }, [vessels]);

  const filteredVessels = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return namedVessels;
    }

    return namedVessels.filter((v) => {
      const name = v.name.toLowerCase();
      const mmsi = String(v.mmsi);

      return (
        name.includes(query) ||
        mmsi.includes(query)
      );
    });
  }, [namedVessels, search]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  if (namedVessels.length === 0) {
    return null;
  }

  const selectedVessel = namedVessels.find(
    (v) =>
      String(v.mmsi) ===
      String(selectedMmsi)
  );

  return (
    <div
      ref={wrapperRef}
      style={styles.wrapper}
    >
      {/* Dropdown button */}
      <button
        type="button"
        style={styles.selectButton}
        onClick={() => {
          setOpen((value) => !value);

          if (!open) {
            setSearch("");
          }
        }}
      >
        <span>
          {selectedVessel
            ? `${selectedVessel.name} — MMSI ${selectedVessel.mmsi}`
            : `Available Vessels (${namedVessels.length})`}
        </span>

        <span style={styles.arrow}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={styles.dropdown}>
          {/* Search at top of dropdown */}
          <div style={styles.searchWrapper}>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search vessel..."
              style={styles.search}
              onClick={(e) =>
                e.stopPropagation()
              }
            />
          </div>

          {/* Results count */}
          <div style={styles.resultCount}>
            {search
              ? `${filteredVessels.length} of ${namedVessels.length} vessels`
              : `${namedVessels.length} vessels`}
          </div>

          {/* Vessel list */}
          <div style={styles.list}>
            {filteredVessels.length > 0 ? (
              filteredVessels.map((v) => {
                const isSelected =
                  String(v.mmsi) ===
                  String(selectedMmsi);

                return (
                  <button
                    key={v.mmsi}
                    type="button"
                    style={{
                      ...styles.vesselItem,
                      ...(isSelected
                        ? styles.selectedItem
                        : {}),
                    }}
                    onClick={() => {
                      onSelect(
                        Number(v.mmsi)
                      );
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <span
                      style={
                        styles.vesselName
                      }
                    >
                      {v.name}
                    </span>

                    <span
                      style={
                        styles.vesselMmsi
                      }
                    >
                      MMSI {v.mmsi}
                    </span>
                  </button>
                );
              })
            ) : (
              <div
                style={styles.noResults}
              >
                No vessels found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    position: "fixed",
    top: 16,
    right: 16,
    zIndex: 1000,
    fontFamily:
      "system-ui, sans-serif",
    width: 260,
  },

  selectButton: {
    width: "100%",
    padding: "8px 10px",
    fontSize: 13,
    borderRadius: 8,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    boxShadow:
      "0 2px 12px rgba(0,0,0,0.25)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    textAlign: "left",
  },

  arrow: {
    fontSize: 10,
    color: "#6b7280",
    flexShrink: 0,
  },

  dropdown: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    background: "#ffffff",
    borderRadius: 8,
    border:
      "1px solid #d1d5db",
    boxShadow:
      "0 4px 16px rgba(0,0,0,0.25)",
    overflow: "hidden",
  },

  searchWrapper: {
    padding: 8,
    borderBottom:
      "1px solid #e5e7eb",
    background: "#ffffff",
  },

  search: {
    width: "100%",
    boxSizing: "border-box",
    padding: "8px 10px",
    fontSize: 13,
    borderRadius: 6,
    border:
      "1px solid #d1d5db",
    outline: "none",
  },

  resultCount: {
    padding: "6px 10px",
    fontSize: 11,
    color: "#6b7280",
    background: "#f9fafb",
    borderBottom:
      "1px solid #e5e7eb",
  },

  list: {
    maxHeight: 300,
    overflowY: "auto",
  },

  vesselItem: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    padding: "9px 10px",
    border: "none",
    borderBottom:
      "1px solid #f3f4f6",
    background: "#ffffff",
    cursor: "pointer",
    textAlign: "left",
  },

  selectedItem: {
    background: "#eff6ff",
  },

  vesselName: {
    fontSize: 13,
    fontWeight: 500,
    color: "#111827",
  },

  vesselMmsi: {
    fontSize: 11,
    color: "#6b7280",
  },

  noResults: {
    padding: "16px 10px",
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
};