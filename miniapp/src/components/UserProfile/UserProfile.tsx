import './UserProfile.css';
import ProfileImage from '../../assets/Anna.png';

function UserProfile() {
  return (
    <div
      className='user-profile-container'
      style={{ backgroundImage: `url(${ProfileImage})` }}
    ></div>
  );
}

export default UserProfile;
