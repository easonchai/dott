import './Profile.css';
import Nav from '../components/Nav/Nav.tsx';
import BottomMenu from '../components/BottomMenu/BottomMenu.tsx';
('./components/Nav');

function Profile() {
  return (
    <div className='home-container'>
      <Nav />
      <BottomMenu />
    </div>
  );
}

export default Profile;
