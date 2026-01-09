"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

import { Transaction } from "@/lib/types";

interface CategoryChartProps {
  transactions: Transaction[];
}

const COLORS = [
  "#f43f5e",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#6366f1",
];

export default function CategoryChart({ transactions }: CategoryChartProps) {
  const data = useMemo(() => {
    const expenses = transactions.filter(
      (t) => t.type === "expense" && (t.status === "paid" || t.status === "pending")
    );

    const grouped: Record<string, number> = {};
    
    expenses.forEach((t) => {
      const catName = t.category || "General";
      
      if (!grouped[catName]) {
        grouped[catName] = 0;
      }
      grouped[catName] += Math.abs(t.amount);
    });

    const chartData = Object.keys(grouped).map((key) => ({
      name: key,
      value: grouped[key],
    }));

    return chartData.sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <p>No hay gastos registrados en este periodo.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-75">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                className="outline-none"
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number | string | undefined) => {
                const numericValue = Number(value) || 0;
                
                return new Intl.NumberFormat("es-MX", { 
                    style: "currency", 
                    currency: "MXN" 
                }).format(numericValue);
            }}
            contentStyle={{ 
                backgroundColor: "#1e293b", 
                borderColor: "#334155", 
                color: "#fff",
                borderRadius: "8px"
            }}
            itemStyle={{ color: "#fff", fontWeight: 500 }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}