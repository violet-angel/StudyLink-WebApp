interface ServiceCardProps {
  title: string;
  description: string;
}

function ServiceCard({ title, description }: ServiceCardProps) {
  return (
    <article className="card service-card">
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

export default ServiceCard;
