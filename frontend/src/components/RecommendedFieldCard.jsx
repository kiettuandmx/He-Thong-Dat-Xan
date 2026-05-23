import { Link } from 'react-router-dom';

const RecommendedFieldCard = ({ field, compact = false }) => {
  const className = compact ? 'recommended-field recommended-field--compact' : 'recommended-field';
  const content = (
    <>
      <div className="recommended-field__head">
        <h3 className="recommended-field__name">{field.name}</h3>
        <span className="recommended-field__tag">De xuat</span>
      </div>
      <ul className="recommended-field__reasons">
        {field.reasons?.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </>
  );

  if (compact && field.field_id) {
    return (
      <Link className={`${className} recommended-field--link`} to={`/field/${field.field_id}`}>
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
};

export default RecommendedFieldCard;
