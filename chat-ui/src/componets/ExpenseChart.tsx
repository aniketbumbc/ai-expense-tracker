import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from './ui/chart';
import { useTheme } from '@/lib/theme';

// Categorical palette (dark-surface steps) — fixed order, never cycled.
const CATEGORY_COLORS = [
  '#3987e5', // blue
  '#d95926', // orange
  '#199e70', // aqua
  '#c98500', // yellow
  '#d55181', // magenta
  '#008300', // green
  '#9085e9', // violet
  '#e66767', // red
];
const MAX_SLICES = CATEGORY_COLORS.length;
const OTHER_COLOR = '#898781';

const chartConfig = {
  amount: {
    label: 'Amount',
    color: '#199e70',
  },
} satisfies ChartConfig;

type ChartElement = {
  [key: string]: string | number;
};

function foldIntoOther(chartData: ChartElement[], labelKey: string) {
  if (chartData.length <= MAX_SLICES) return chartData;

  const sorted = [...chartData].sort(
    (a, b) => Number(b.amount) - Number(a.amount),
  );
  const top = sorted.slice(0, MAX_SLICES - 1);
  const rest = sorted.slice(MAX_SLICES - 1);
  const otherTotal = rest.reduce((sum, item) => sum + Number(item.amount), 0);


  return [...top, { [labelKey]: 'Other', amount: otherTotal }];
}

export function ExpenseChart({
  chartData,
  labelKey,
}: {
  chartData: ChartElement[];
  labelKey: string;
}) {
  const { theme } = useTheme();

  if (!chartData || chartData.length === 0) {
    return null;
  }

  const sliceStroke = theme === 'dark' ? '#1a1a19' : '#ffffff';
  const gridStroke = theme === 'dark' ? '#2c2c2a' : '#e4e4e7';

  // Few periods -> proportions read better as a donut.
  // Many periods -> a trend over time reads better as a line.
  const useDonut = chartData.length <= 6;

  if (useDonut) {
    const donutData = foldIntoOther(chartData, labelKey);
    console.log("labelKey",labelKey)

    return (
      <ChartContainer
        config={chartConfig}
        className="min-h-[280px] w-full max-w-md py-12 bg-card rounded-xl my-4 p-4">
        <PieChart accessibilityLayer>
          <ChartTooltip
            content={
              <ChartTooltipContent
                nameKey={labelKey}
                hideLabel
                formatter={
                  ((
                    value: number,
                    _name: string,
                    item: { payload?: { fill?: string }; color?: string },
                  ) => (
                    <>
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: item.payload?.fill || item.color }}
                      />
                      <span className="text-foreground font-mono font-medium tabular-nums ml-auto">
                        { 'Expense $'+Number(value).toLocaleString()}
                      </span>
                    </>
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  )) as any
                }
              />
            }
            cursor={false}
          />
          <Pie
            data={donutData}
            dataKey="amount"
            nameKey={labelKey}
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            strokeWidth={2}
            stroke={sliceStroke}>
            {donutData.map((entry, index) => (
              <Cell
                key={entry[labelKey] as string}
                fill={
                  entry[labelKey] === 'Other'
                    ? OTHER_COLOR
                    : CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                }
              />
            ))}
          </Pie>
          <ChartLegend
            content={<ChartLegendContent nameKey={labelKey} />}
            verticalAlign="bottom"
          />
        </PieChart>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="min-h-[280px] w-full max-w-md py-12 bg-card rounded-xl my-4 p-4">
      <LineChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} stroke={gridStroke} />
        <ChartTooltip
          content={<ChartTooltipContent hideLabel />}
          cursor={false}
        />
        <XAxis
          dataKey={labelKey}
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 30)}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={10} width={40} />
        <Line
          dataKey="amount"
          type="monotone"
          stroke="#199e70"
          strokeWidth={2}
          dot={{ r: 4, fill: '#199e70' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
