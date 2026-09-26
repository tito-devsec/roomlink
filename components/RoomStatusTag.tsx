import { Colors, themed } from '../constants/Colors';
import { Tag } from './neo';

const STATUS = themed((): Record<string, [string, string]> => ({
  published: [Colors.green, 'Published'],
  pending: [Colors.orange, 'Pending'],
  paused: [Colors.surface, 'Paused'],
  occupied: [Colors.cyan, 'Occupied'],
}));

export default function RoomStatusTag({ status }: { status: string }) {
  const [color, label] = STATUS[status] || [Colors.surface, status];
  return <Tag label={label} color={color} />;
}
