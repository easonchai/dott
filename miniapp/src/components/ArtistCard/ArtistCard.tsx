import './ArtistCard.css';
import cardBTS from '../../assets/img-artists/card-bts.png';

function ArtistCard() {
  return (
    <div className='artist-card'>
      <div className='image-container'>
        <img
          className='image'
          src={cardBTS}
          alt='BTS Card'
        />
      </div>
      <div className='description'>
        <div className='artist-name'>BTS</div>
        <div>Total Score: 100</div>
      </div>
    </div>
  );
}

export default ArtistCard;
