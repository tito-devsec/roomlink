import { Redirect, Tabs } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Colors } from '../../constants/Colors';
import { NeoTabBar, type TabSpec } from '../../components/neo';
import { HOME, accountRole } from '../../services/role';
import { useDemoSession } from '../../services/demoAuth';

const TABS: TabSpec[] = [
  { name: 'index', icon: 'home', label: 'Home' },
  { name: 'explore', icon: 'search', label: 'Explore' },
  { name: 'map', icon: 'map', label: 'Map' },
  { name: 'messages', icon: 'chatbubbles', label: 'Chat' },
  { name: 'profile', icon: 'person', label: 'Profile' },
];

export default function TabsLayout() {
  const { user } = useUser();
  const demo = useDemoSession();
  // Landlord accounts belong in their dashboard, never the tenant area.
  if ((user ? accountRole(user) : demo?.role) === 'landlord') return <Redirect href={HOME.landlord} />;

  return (
    <Tabs
      tabBar={props => <NeoTabBar {...props} tabs={TABS} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: Colors.bg } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="map" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
