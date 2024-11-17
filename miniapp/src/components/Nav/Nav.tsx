import dottLogo from '../../assets/dott.svg';
import UserProfile from '../UserProfile/UserProfile';
import './Nav.css';

function Nav() {
  return (
    <div className='nav-container'>
      <a
        href='./'
        target='_blank'
        className='home-logo'
      >
        <img
          src={dottLogo}
          className='logo'
          alt='dott logo'
        />
      </a>
      <div className='user-profile'>
        <UserProfile />
      </div>
    </div>
  );
}

export default Nav;
