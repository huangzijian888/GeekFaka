"use client"

import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

interface RevenueChartProps {
  data: { date: string; amount: number }[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: 'rgba(24, 24, 27, 0.9)',
      borderColor: 'rgba(168, 85, 247, 0.2)',
      textStyle: {
        color: '#fff'
      }
    },
    grid: {
      top: '10%',
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date),
      axisTick: {
        alignWithLabel: true
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      axisLabel: {
        color: '#71717a',
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.05)',
          type: 'dashed'
        }
      },
      axisLabel: {
        color: '#71717a',
        fontSize: 10
      }
    },
    series: [
      {
        name: '收入 (¥)',
        type: 'bar',
        barWidth: '40%',
        data: data.map(item => item.amount),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(168, 85, 247, 0.8)' },
            { offset: 1, color: 'rgba(168, 85, 247, 0.3)' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: 'rgba(168, 85, 247, 1)'
          }
        }
      },
      {
        name: '趋势',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: data.map(item => item.amount),
        lineStyle: {
          color: '#a855f7',
          width: 2,
          shadowBlur: 10,
          shadowColor: 'rgba(168, 85, 247, 0.5)'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(168, 85, 247, 0.1)' },
            { offset: 1, color: 'transparent' }
          ])
        }
      }
    ]
  };

  return (
    <div className="w-full h-[250px]">
      <ReactECharts 
        option={option} 
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
}
