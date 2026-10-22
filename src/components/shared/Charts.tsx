import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';

const PALETTE = ['#2563EB', '#0EA5E9', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

const tooltipStyle = {
  backgroundColor: '#0F172A',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#E2E8F0',
  fontSize: 12,
};

export interface SimpleDatum {
  name: string;
  value: number;
}

/** Gráfico de barras agrupadas (altas por mes). */
export function BarChartCard({
  title,
  description,
  data,
  series,
  height = 260,
  actions,
}: {
  title: string;
  description?: string;
  data: Array<Record<string, string | number>>;
  series: Array<{ key: string; color: string; label: string }>;
  height?: number;
  actions?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} actions={actions} />
      <CardBody className="h-[300px] pt-4">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#33415522" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#2563EB10' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {series.map((item) => (
              <Bar key={item.key} dataKey={item.key} name={item.label} fill={item.color} radius={[6, 6, 0, 0]} maxBarSize={34} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}

/** Gráfico de líneas con área suavizada. */
export function AreaChartCard({
  title,
  description,
  data,
  dataKey,
  color = '#2563EB',
  height = 240,
}: {
  title: string;
  description?: string;
  data: Array<Record<string, string | number>>;
  dataKey: string;
  color?: string;
  height?: number;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody className="h-[280px] pt-4">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#33415522" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}

/** Gráfico de dona para distribuciones (categorías, combustibles, stock). */
export function DonutChartCard({
  title,
  description,
  data,
  height = 240,
  centerLabel,
  centerValue,
}: {
  title: string;
  description?: string;
  data: SimpleDatum[];
  height?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody className="h-[300px] pt-2">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
        {centerLabel && (
          <div className="-mt-40 pointer-events-none text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{centerValue}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{centerLabel}</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

/** Barras horizontales simples (ranking). */
export function HorizontalBars({ title, data, height = 260 }: { title: string; data: SimpleDatum[]; height?: number }) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody className="h-[300px] pt-4">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#33415522" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={90} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#0EA5E910' }} />
            <Bar dataKey="value" name="Unidades" fill="#0EA5E9" radius={[0, 6, 6, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
