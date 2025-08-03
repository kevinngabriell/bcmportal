import { Calendar, Badge, type BadgeProps, type CalendarProps } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

type EventData = {
  type: BadgeProps['status'];
  content: string;
  startDate: string;
  endDate: string;
};

const allEvents: EventData[] = [
  {
    type: 'warning',
    content: 'Event A',
    startDate: '2025-08-08',
    endDate: '2025-08-12',
  },
  {
    type: 'success',
    content: 'Event BC',
    startDate: '2025-08-15',
    endDate: '2025-08-19',
  },
];

const getListData = (value: Dayjs) => {
  return allEvents.filter((event) =>
    value.isAfter(dayjs(event.startDate), 'day') &&
    value.isBefore(dayjs(event.endDate), 'day')
  );
};

const dateCellRender = (value: Dayjs) => {
  const listData = getListData(value);
  return (
    <ul className="events" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {listData.map((item, index) => (
        <li key={index}>
          <Badge status={item.type} text={item.content} />
        </li>
      ))}
    </ul>
  );
};

const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
  if (info.type === 'date') return dateCellRender(current);
  return info.originNode;
};

function BCMCalendar() {
  return <Calendar cellRender={cellRender} />
}

export default BCMCalendar;