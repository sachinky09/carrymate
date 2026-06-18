import StatusBadge from './StatusBadge.jsx';

export default function TicketCard({ source, destination, status, fields, children }) {
  return (
    <div className="ticket">
      <div className="ticket-main">
        <div className="ticket-route">
          <div className="ticket-stop">
            <span className="ticket-code">{source}</span>
            <span className="ticket-label">FROM</span>
          </div>
          <div className="ticket-divider">
            <span className="ticket-dash" />
          </div>
          <div className="ticket-stop ticket-stop-end">
            <span className="ticket-code">{destination}</span>
            <span className="ticket-label">TO</span>
          </div>
        </div>
        <div className="ticket-fields">
          {fields.map((f) => (
            <div className="ticket-field" key={f.label}>
              <span className="ticket-field-label">{f.label}</span>
              <span className="ticket-field-value">{f.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="ticket-perforation">
        <span className="ticket-hole" />
        <span className="ticket-hole" />
      </div>
      <div className="ticket-stub">
        <StatusBadge status={status} />
        <div className="ticket-actions">{children}</div>
      </div>
    </div>
  );
}
