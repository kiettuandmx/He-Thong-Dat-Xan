const RecommendedFieldCard = ({ field }) => (
  <article className="card border-0 shadow-sm mb-3">
    <div className="card-body">
      <h2 className="h5 fw-bold mb-2">{field.name}</h2>
      <ul className="mb-0 text-muted">
        {field.reasons?.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </div>
  </article>
);

export default RecommendedFieldCard;
