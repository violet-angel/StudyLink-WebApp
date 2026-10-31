interface ListingCardProps {
  title: string;
  description: string;
  area: string;
  price: string;
}

function ListingCard({ title, description, area, price }: ListingCardProps) {
  return (
    <article className="card listing-card">
      <header>
        <h3>{title}</h3>
        <p className="listing-price">Session: {price}</p>
      </header>
      <p>{description}</p>
      <div className="listing-meta">Group size: {area}</div>
    </article>
  );
}

export default ListingCard;
