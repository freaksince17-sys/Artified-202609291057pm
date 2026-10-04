import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { TrendingUp, Users, Heart, Eye, ArrowUpRight, BarChart3, LineChart } from 'lucide-react';

interface DataPoint {
  dateStr: string;
  followers: number;
  engagement: number;
}

// Generate data for the last 30 days
const generate30DayData = (): DataPoint[] => {
  const data: DataPoint[] = [];
  let baseFollowers = 8420;
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Growth step: add 100 to 200 followers per day with slight random noise
    const growth = Math.round(110 + Math.random() * 80);
    baseFollowers += growth;
    
    // Engagement step: floats between 4.2% and 6.8%
    const engagement = parseFloat((4.5 + Math.random() * 2.2).toFixed(2));
    
    data.push({
      dateStr,
      followers: baseFollowers,
      engagement
    });
  }
  return data;
};

export const InstagramPerformanceDashboard: React.FC = () => {
  const data = generate30DayData();
  const followerChartRef = useRef<SVGSVGElement | null>(null);
  const engagementChartRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!followerChartRef.current || !engagementChartRef.current) return;

    // --- CHART 1: FOLLOWER GROWTH (D3 Area/Line Chart) ---
    const drawFollowers = () => {
      const svg = d3.select(followerChartRef.current);
      svg.selectAll('*').remove(); // Clear previous drawing

      const width = 450;
      const height = 180;
      const margin = { top: 15, right: 15, bottom: 25, left: 45 };

      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // X Scale
      const xScale = d3.scalePoint()
        .domain(data.map(d => d.dateStr))
        .range([0, chartWidth]);

      // Y Scale
      const minF = d3.min(data, d => d.followers) || 8000;
      const maxF = d3.max(data, d => d.followers) || 13000;
      const yScale = d3.scaleLinear()
        .domain([minF - 200, maxF + 200])
        .range([chartHeight, 0]);

      // Grid Lines
      g.append('g')
        .attr('class', 'grid-lines')
        .attr('stroke', '#E8DFD8')
        .attr('stroke-opacity', 0.4)
        .call(d3.axisLeft(yScale)
          .tickSize(-chartWidth)
          .tickFormat(() => '')
        );

      // X Axis
      g.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .attr('color', '#8C7A6B')
        .call(d3.axisBottom(xScale)
          .tickValues(data.filter((_, idx) => idx % 6 === 0).map(d => d.dateStr))
        )
        .selectAll('text')
        .attr('font-size', '10px');

      // Y Axis
      g.append('g')
        .attr('color', '#8C7A6B')
        .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format(',')))
        .selectAll('text')
        .attr('font-size', '10px');

      // Area Path
      const area = d3.area<DataPoint>()
        .x(d => xScale(d.dateStr) || 0)
        .y0(chartHeight)
        .y1(d => yScale(d.followers))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'url(#follower-gradient)')
        .attr('d', area);

      // Line Path
      const line = d3.line<DataPoint>()
        .x(d => xScale(d.dateStr) || 0)
        .y(d => yScale(d.followers))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#D4AF37')
        .attr('stroke-width', 2.5)
        .attr('d', line);

      // Follower Gradient
      const defs = svg.append('defs');
      const grad = defs.append('linearGradient')
        .attr('id', 'follower-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      grad.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#D4AF37')
        .attr('stop-opacity', 0.35);

      grad.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#FAF8F5')
        .attr('stop-opacity', 0.05);

      // Interactive tooltips/dots
      g.selectAll('.dot')
        .data(data.filter((_, idx) => idx % 4 === 0 || idx === 29))
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.dateStr) || 0)
        .attr('cy', d => yScale(d.followers))
        .attr('r', 4)
        .attr('fill', '#1C1B1A')
        .attr('stroke', '#D4AF37')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .append('title')
        .text(d => `${d.dateStr}: ${d.followers.toLocaleString()} Followers`);
    };

    // --- CHART 2: ENGAGEMENT RATE (D3 Bar Chart) ---
    const drawEngagement = () => {
      const svg = d3.select(engagementChartRef.current);
      svg.selectAll('*').remove();

      const width = 450;
      const height = 180;
      const margin = { top: 15, right: 15, bottom: 25, left: 40 };

      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // X Scale
      const xScale = d3.scaleBand()
        .domain(data.map(d => d.dateStr))
        .range([0, chartWidth])
        .padding(0.2);

      // Y Scale
      const maxE = d3.max(data, d => d.engagement) || 8;
      const yScale = d3.scaleLinear()
        .domain([0, maxE + 1])
        .range([chartHeight, 0]);

      // Grid Lines
      g.append('g')
        .attr('class', 'grid-lines')
        .attr('stroke', '#E8DFD8')
        .attr('stroke-opacity', 0.4)
        .call(d3.axisLeft(yScale)
          .tickSize(-chartWidth)
          .tickFormat(() => '')
        );

      // X Axis
      g.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .attr('color', '#8C7A6B')
        .call(d3.axisBottom(xScale)
          .tickValues(data.filter((_, idx) => idx % 6 === 0).map(d => d.dateStr))
        )
        .selectAll('text')
        .attr('font-size', '10px');

      // Y Axis
      g.append('g')
        .attr('color', '#8C7A6B')
        .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}%`))
        .selectAll('text')
        .attr('font-size', '10px');

      // Render Bars with Gradient Color
      g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.dateStr) || 0)
        .attr('y', d => yScale(d.engagement))
        .attr('width', xScale.bandwidth())
        .attr('height', d => chartHeight - yScale(d.engagement))
        .attr('fill', 'url(#engagement-gradient)')
        .attr('rx', 2)
        .style('cursor', 'pointer')
        .append('title')
        .text(d => `${d.dateStr}: ${d.engagement}% Engagement`);

      // Bar Gradient
      const defs = svg.append('defs');
      const grad = defs.append('linearGradient')
        .attr('id', 'engagement-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      grad.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#833AB4');

      grad.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#FD1D1D');
    };

    drawFollowers();
    drawEngagement();

    // Redraw on window resize
    const handleResize = () => {
      drawFollowers();
      drawEngagement();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data]);

  const latestFollowers = data[29]?.followers || 12450;
  const initialFollowers = data[0]?.followers || 8420;
  const growthRate = (((latestFollowers - initialFollowers) / initialFollowers) * 100).toFixed(1);
  const avgEngagement = (data.reduce((acc, curr) => acc + curr.engagement, 0) / 30).toFixed(2);

  return (
    <div className="space-y-5 text-xs text-[#1C1B1A]">
      
      {/* Metric Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-[#E8DFD8] flex items-center justify-between shadow-2xs hover:border-[#D4AF37] transition-all">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-[#8C7A6B] block">Follower Account Growth</span>
            <span className="text-xl font-serif font-black text-[#1C1B1A] tracking-tight">{latestFollowers.toLocaleString()}</span>
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{growthRate}% over 30d</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[#D4AF37]">
            <Users className="w-5 h-5 text-[#D4AF37]" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8DFD8] flex items-center justify-between shadow-2xs hover:border-[#833AB4] transition-all">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-[#8C7A6B] block">Average Engagement Rate</span>
            <span className="text-xl font-serif font-black text-[#1C1B1A] tracking-tight">{avgEngagement}%</span>
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              <span>Industry High (Avg: 2.1%)</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#833AB4]">
            <Heart className="w-5 h-5 text-[#833AB4] fill-[#833AB4]/10" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8DFD8] flex items-center justify-between shadow-2xs hover:border-[#FD1D1D] transition-all">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-[#8C7A6B] block">Reels Playbacks (30d)</span>
            <span className="text-xl font-serif font-black text-[#1C1B1A] tracking-tight">42,850 views</span>
            <span className="text-[10px] text-[#8C7A6B] block mt-1">Steady Slow-Motion Loops</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-[#FD1D1D]">
            <Eye className="w-5 h-5 text-[#FD1D1D]" />
          </div>
        </div>
      </div>

      {/* D3 charts visualizations grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Followers Line Chart */}
        <div className="bg-white p-4 border border-[#E8DFD8] rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE5]">
            <h5 className="font-serif font-bold text-xs text-[#1C1B1A] flex items-center gap-1.5">
              <LineChart className="w-4 h-4 text-[#D4AF37]" />
              <span>Followers Trend (Cumulative)</span>
            </h5>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A6B] bg-stone-50 px-2.5 py-0.5 rounded-md border border-[#E8DFD8]">30d area</span>
          </div>
          <div className="w-full overflow-hidden flex justify-center">
            <svg 
              ref={followerChartRef} 
              viewBox="0 0 450 180" 
              className="w-full max-w-[450px] overflow-visible"
            />
          </div>
        </div>

        {/* Engagement Rate Bar Chart */}
        <div className="bg-white p-4 border border-[#E8DFD8] rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE5]">
            <h5 className="font-serif font-bold text-xs text-[#1C1B1A] flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#833AB4]" />
              <span>Daily Engagement Rates</span>
            </h5>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A6B] bg-stone-50 px-2.5 py-0.5 rounded-md border border-[#E8DFD8]">30d bar</span>
          </div>
          <div className="w-full overflow-hidden flex justify-center">
            <svg 
              ref={engagementChartRef} 
              viewBox="0 0 450 180" 
              className="w-full max-w-[450px] overflow-visible"
            />
          </div>
        </div>

      </div>

    </div>
  );
};
