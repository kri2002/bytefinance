"use client";

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";

interface PayloadItem {
  dataKey: string;
  value: number;
  payload: {
    name: string;
    income: number;
    expense: number;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string;
}

interface ChartData {
  name: string;
  income: number;
  expense: number;
}

interface WeeklyChartProps {
  onDayClick: (day: string) => void;
  chartData: ChartData[];
}
interface ChartMouseEvent {
  activeLabel?: string | number;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const incomeData = payload.find((p) => p.dataKey === "income");
    const expenseData = payload.find((p) => p.dataKey === "expense");

    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
        <p className="font-bold text-slate-200 mb-2 text-base">{label}</p>
        <div className="space-y-1">
          {incomeData?.value !== undefined && (
            <p className="text-emerald-400 font-medium">
              + Ingresos: ${incomeData.value.toLocaleString()}
            </p>
          )}
          {expenseData?.value !== undefined && (
            <p className="text-blue-400 font-medium">
              - Gastos: ${expenseData.value.toLocaleString()}
            </p>
          )}
        </div>
        <p className="text-slate-500 mt-2 italic">Click para ver detalles</p>
      </div>
    );
  }
  return null;
};

export default function WeeklyChart({
  onDayClick,
  chartData,
}: WeeklyChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        onClick={(data: unknown) => {
          const chartData = data as ChartMouseEvent;
          if (chartData && chartData.activeLabel !== undefined) {
            onDayClick(String(chartData.activeLabel));
          }
        }}
        barGap={4}
      >
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#64748b", fontSize: 12 }}
          dy={10}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.05)" }}
          content={<CustomTooltip />}
        />

        <Bar
          dataKey="income"
          fill="#10b981"
          barSize={20}
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="expense"
          fill="#3b82f6"
          barSize={20}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
