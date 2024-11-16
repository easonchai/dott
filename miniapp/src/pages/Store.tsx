import BottomMenu from '../components/BottomMenu/BottomMenu';
import Nav from '../components/Nav/Nav';
import NftCard from '../components/NftCard/NftCard';
import './Store.css';

function Store() {
  return (
    <div className='store-container'>
      <Nav />
      <div className='score-number'>12,356</div>
      <div className='nft-cards'>
        <NftCard />
        <NftCard />
        <NftCard />
        <NftCard />
        <NftCard />
        <NftCard />
        <NftCard />
        <NftCard />
      </div>

      <BottomMenu />
    </div>
  );
}

export default Store;
