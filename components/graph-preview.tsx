import type { MeaningTarget } from "@/lib/genesis2-fixtures";

export function GraphPreview({ target }: { target: MeaningTarget }) {
  return (
    <div className="graph-preview">
      <div className="graph-preview__hero">
        <span className="eyebrow">Restrained graph preview</span>
        <h3>{target.label}</h3>
        <p>{target.graph.nodes.length} nodes · readable now, expandable later</p>
      </div>
      <div className="graph-node-list">
        {target.graph.nodes.map((node) => (
          <div key={node.id} className="graph-node">
            <strong>{node.label}</strong>
            <span>{node.role}</span>
          </div>
        ))}
      </div>
      <div className="graph-edge-list">
        {target.graph.edges.map((edge) => (
          <div key={`${edge.from}-${edge.to}-${edge.label}`} className="graph-edge">
            <span>{edge.from}</span>
            <em>{edge.label}</em>
            <span>{edge.to}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
