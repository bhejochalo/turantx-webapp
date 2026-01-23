import { useParams } from "react-router-dom";
import { infoContent } from "./infoContent";
import "./InfoPage.css";

export default function InfoPage() {
  const { type } = useParams();
  const data = infoContent[type];

  if (!data) return <div className="info-page">Content not found</div>;

  return (
    <div className="info-page">
      <div className="info-card">
        <h1>{data.title}</h1>
        <pre>{data.body}</pre>
      </div>
    </div>
  );
}
