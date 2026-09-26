import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { router } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Colors, themed } from '../../constants/Colors';
import { EmptyState, ScreenHeader, Tag } from '../../components/neo';
import HostelCard from '../../components/HostelCard';
import { MOCK_HOSTELS } from '../../services/mockData';
import { listFavorites, toggleFavorite } from '../../services/data';

export default function SavedScreen() {
  const { user } = useUser();
  const [saved, setSaved] = useState(MOCK_HOSTELS.slice(0, 4));

  useEffect(() => {
    let alive = true;
    listFavorites(user?.id).then(rows => { if (alive) setSaved(rows); }).catch(() => {});
    return () => { alive = false; };
  }, [user?.id]);

  const removeItem = (id: string) => {
    Alert.alert('Remove', 'Remove this hostel from saved?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        setSaved(s => s.filter(h => h.id !== id));
        if (user?.id) toggleFavorite(user.id, id, false);
      } },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Saved hostels"
        right={<Tag label={String(saved.length)} color={Colors.pink} size="md" style={styles.countTag} />}
      />

      <FlatList
        data={saved}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={(
          <EmptyState
            icon="heart"
            color={Colors.pink}
            title="No saved hostels"
            subtitle="Heart a hostel to save it for later"
            action="Browse hostels"
            onAction={() => router.push('/(tabs)/explore')}
          />
        )}
        renderItem={({ item }) => (
          <HostelCard
            hostel={item}
            saved
            onToggleSave={() => removeItem(item.id)}
            onPress={() => router.push(`/hostel/${item.id}`)}
          />
        )}
      />
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  countTag: { alignSelf: 'center', minWidth: 42, justifyContent: 'center' },
  list: { padding: 20, paddingBottom: 60 },
}));
