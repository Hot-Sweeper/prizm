export default function GenerateLoading() {
  return (
    <main
      id="maincontent"
      tabIndex={-1}
      style={{
        minHeight: "100svh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#060606",
        color: "#f3f3f3",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Loading studio</p>
        <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>Checking session and credits...</p>
      </div>
    </main>
  );
}
