import React from 'react';
import './Card.css';

interface CardProps {
    name: string;
    imageUrl: string;
    stats: string; // Assuming stats is a string for now
    description: string;
}

const Card: React.FC<CardProps> = ({ name, imageUrl, stats, description }) => {
    return (
        <div className="card-container">
            <img src={imageUrl} alt={name} className="card-image" />
            <div className="card-content">
                <h2 className="card-name">{name}</h2>
                <p className="card-stats">{stats}</p>
                <p className="card-description">{description}</p>
            </div>
        </div>
    );
};

export default Card; 