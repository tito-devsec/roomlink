import { Redirect, Tabs } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Colors } from '../../constants/Colors';
import { NeoTabBar, type TabSpec } from '../../components/neo';
import { HOME, accountRole } from '../../services/role';
import { useDemoSession } from '../../services/demoAuth';

const TABS: TabSpec[] = [
  { name: 'dashboard', icon: 'grid', label: 'Dashboard' },
  { name: 'rooms', icon: 'bed', label: 'Rooms' },
  { name: 'bookings', icon: 'document-text', label: 'Bookings' },
  // Named "account" so its URL doesn't collide with the tenant /profile tab.
  { name: 'account', icon: 'person', label: 'Profile' },
];

export default function LandlordLayout() {
  const { user } = useUser();
  const demo = useDemoSession();
  // Tenant accounts belong in the tenant area, never the landlord dashboard.
  if ((user ? accountRole(user) : demo?.role) === 'student') return <Redirect href={HOME.student} />;

  return (
    <Tabs
      tabBar={props => <NeoTabBar {...props} tabs={TABS} accent={Colors.purple} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: Colors.bg } }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="rooms" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}
