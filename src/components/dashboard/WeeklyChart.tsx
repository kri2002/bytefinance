"use client";

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WeeklyChartProps {
  chartData: { name: string; income: number; expense: number }[];
  onDayClick: (day: string) => void;
  selectedDay?: string | null;
  // Nuevas props para la navegación interna
  dateRange: string;
  onPrevClick: () => void;
  onNextClick: () => void;
  disableNext: boolean;
}

export default function WeeklyChart({
  chartData,
  onDayClick,
  selectedDay,
  dateRange,
  onPrevClick,
  onNextClick,
  disableNext,
}: WeeklyChartProps) {
  return (
    <div className="flex flex-col h-full w-full">
      {/* HEADER INTERNO DE LA GRÁFICA */}
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="font-semibold text-white text-sm md:text-base">
          Flujo Semanal
        </h3>

        {/* CONTROLES DE NAVEGACIÓN */}
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
          <button
            onClick={onPrevClick}
            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-xs font-medium text-slate-300 px-2 min-w-[90px] text-center">
            {dateRange}
          </span>

          <button
            onClick={onNextClick}
            disabled={disableNext}
            className={`p-1 rounded transition-colors ${
              disableNext
                ? "text-slate-600 cursor-not-allowed"
                : "text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* GRÁFICA */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            barGap={4}
            onClick={(data) => {
              if (data && data.activeLabel) {
                onDayClick(data.activeLabel as string);
              }
            }}
            className="cursor-pointer"
          >
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              dy={10}
            />
            <Tooltip
              cursor={{ fill: "#1e293b", opacity: 0.4 }}
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#1e293b",
                color: "#fff",
                borderRadius: "8px",
              }}
              itemStyle={{ fontSize: "12px" }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
              labelStyle={{ color: "#94a3b8", marginBottom: "0.5rem" }}
            />
            <Bar dataKey="income" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-inc-${index}`}
                  fill={entry.income > 0 ? "#10b981" : "transparent"}
                  opacity={selectedDay && selectedDay !== entry.name ? 0.3 : 1}
                />
              ))}
            </Bar>
            <Bar dataKey="expense" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-exp-${index}`}
                  fill={entry.expense > 0 ? "#f43f5e" : "transparent"}
                  opacity={selectedDay && selectedDay !== entry.name ? 0.3 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
