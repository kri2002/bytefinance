'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Transaction {
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  status: string;
}

interface CategoryChartProps {
  transactions: Transaction[];
}

// Mapeo simple de clases Tailwind a Hex para la gráfica
const COLORS_MAP: Record<string, string> = {
    'Comida': '#f97316', // Orange
    'Transporte': '#3b82f6', // Blue
    'Casa': '#6366f1', // Indigo
    'Ocio': '#a855f7', // Purple
    'Salud': '#10b981', // Emerald
    'Suscripciones': '#ec4899', // Pink
    'Otros': '#64748b', // Slate
};

const DEFAULT_COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#f43f5e', '#eab308'];

export default function CategoryChart({ transactions }: CategoryChartProps) {
  
  const data = useMemo(() => {
    // 1. Filtramos solo gastos pagados o pendientes
    const expenses = transactions.filter(t => t.type === 'expense');
    
    // 2. Agrupamos por categoría
    const groups: Record<string, number> = {};
    expenses.forEach(t => {
        const catName = t.category || 'Otros';
        const amount = Math.abs(t.amount);
        groups[catName] = (groups[catName] || 0) + amount;
    });

    // 3. Convertimos a formato para Recharts
    return Object.entries(groups)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value); // Ordenar mayor a menor

  }, [transactions]);

  if (data.length === 0) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <p>No hay datos de gastos aún.</p>
          </div>
      );
  }

  return (
    <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60} // Esto la hace "Dona"
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                >
                    {data.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS_MAP[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} 
                        />
                    ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Monto']}
                />
                <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span className="text-slate-400 text-xs ml-1">{value}</span>}
                />
            </PieChart>
        </ResponsiveContainer>
    </div>
  );
}