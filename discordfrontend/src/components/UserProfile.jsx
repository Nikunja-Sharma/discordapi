import { useAuth } from './AuthContext';
import SubscriptionDashboard from './SubscriptionDashboard';

const UserProfile = () => {
  const { user, logout } = useAuth();

  return <SubscriptionDashboard />;
};

export default UserProfile;