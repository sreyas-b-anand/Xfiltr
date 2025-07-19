import './index.css'
import ReactDOM from "react-dom/client";

export function SidePanelApp() {
  return (
    <div style={{ padding: "1rem", width: "280px" }}>
      <h2>Side Panel</h2>
      <p>This is a React-based side panel!</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<SidePanelApp />);
