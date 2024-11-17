import './BottomMenu.css';

function BottomMenu() {
  return (
    <div className='menu-container'>
      <div className='menu'>
        <a href='/'>Home</a>
      </div>
      <div className='menu'>
        <a href='/store'>Store</a>
      </div>
      <div className='menu'>
        <a href='/chat'>Chat</a>
      </div>
      <div className='menu'>
        <a href='/rank'>Rank</a>
      </div>
    </div>
  );
}

export default BottomMenu;
