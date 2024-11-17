import './NftCard.css';
import nftBTS from '../../assets/img-artists/card-bts.png';

function NftCard() {
  return (
    <div className='nft-card'>
      <div className='image-container'>
        <img
          className='image'
          src={nftBTS}
          alt='item'
        />
      </div>

      <div className='description'>
        <div className='item-name'>Item Name</div>
        <div className='item-description'>Score x2 for 30 days.</div>
        <div className='item-price'>2.99 USDC</div>
      </div>
    </div>
  );
}

export default NftCard;
