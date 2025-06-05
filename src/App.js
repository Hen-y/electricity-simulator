import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import './App.css';

const ElectricityPricingSimulator = () => {
  const [baselineWatts, setBaselineWatts] = useState(1000); // Expected watts per hour
  const [baseRate, setBaseRate] = useState(0.5); // Base rate in Kwacha per watt-hour
  const [penaltyFactor, setPenaltyFactor] = useState(1.5); // Multiplier for above baseline
  const [rewardFactor, setRewardFactor] = useState(0.7); // Multiplier for below baseline
  const [currentHour, setCurrentHour] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const [households] = useState([
    { id: 'A', name: 'Household A', color: '#3B82F6', dailyTotal: 0, dailyCost: 0 },
    { id: 'B', name: 'Household B', color: '#EF4444', dailyTotal: 0, dailyCost: 0 },
    { id: 'C', name: 'Household C', color: '#10B981', dailyTotal: 0, dailyCost: 0 },
  ]);

  const [hourlyData, setHourlyData] = useState([]);
  const [dailyTotals, setDailyTotals] = useState([]);

  // Generate realistic hourly consumption patterns
  const generateHourlyConsumption = (hour, householdId) => {
    const baseConsumption = {
      'A': 800,  // Energy-conscious household
      'B': 1400, // High-consumption household
      'C': 1000, // Average household
    };

    // Simulate daily usage patterns (higher in morning and evening)
    const timeMultiplier = 
      hour >= 6 && hour <= 8 ? 1.4 :    // Morning peak
      hour >= 12 && hour <= 14 ? 1.2 :  // Lunch time
      hour >= 18 && hour <= 22 ? 1.6 :  // Evening peak
      hour >= 23 || hour <= 5 ? 0.6 :   // Night
      1.0;                               // Regular hours

    const randomVariation = 0.8 + Math.random() * 0.4; // ±20% variation
    return Math.round(baseConsumption[householdId] * timeMultiplier * randomVariation);
  };

  const calculateHourlyCost = (watts) => {
    if (watts <= baselineWatts) {
      return watts * baseRate * rewardFactor;
    } else {
      const baselineCost = baselineWatts * baseRate * rewardFactor;
      const excessWatts = watts - baselineWatts;
      const excessCost = excessWatts * baseRate * penaltyFactor;
      return baselineCost + excessCost;
    }
  };

  const simulateHour = () => {
    const newHourData = {
      hour: currentHour,
      time: `${String(currentHour).padStart(2, '0')}:00`,
    };

    households.forEach(household => {
      const consumption = generateHourlyConsumption(currentHour, household.id);
      const cost = calculateHourlyCost(consumption);
      
      newHourData[`${household.id}_consumption`] = consumption;
      newHourData[`${household.id}_cost`] = cost;
      
      household.dailyTotal += consumption;
      household.dailyCost += cost;
    });

    setHourlyData(prev => [...prev.slice(-23), newHourData]);
    
    if (currentHour === 23) {
      // End of day - record daily totals and reset
      const newDailyRecord = {
        day: Math.floor(hourlyData.length / 24) + 1,
        ...households.reduce((acc, h) => {
          acc[`${h.id}_total`] = h.dailyTotal;
          acc[`${h.id}_cost`] = h.dailyCost;
          return acc;
        }, {})
      };
      
      setDailyTotals(prev => [...prev.slice(-6), newDailyRecord]);
      
      // Reset daily totals
      households.forEach(h => {
        h.dailyTotal = 0;
        h.dailyCost = 0;
      });
    }
    
    setCurrentHour((currentHour + 1) % 24);
  };

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(simulateHour, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, currentHour, baselineWatts, baseRate, penaltyFactor, rewardFactor]);

  const resetSimulation = () => {
    setCurrentHour(0);
    setHourlyData([]);
    setDailyTotals([]);
    households.forEach(h => {
      h.dailyTotal = 0;
      h.dailyCost = 0;
    });
    setIsRunning(false);
  };

  const latestHourData = hourlyData[hourlyData.length - 1];

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '24px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', textAlign: 'center', color: '#1f2937', marginBottom: '8px' }}>
          Dynamic Electricity Pricing Simulator
        </h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '24px' }}>
          Zambian Household Energy Usage & Flexible Billing System
        </p>

        {/* Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Baseline Usage (Watts/hour)
            </label>
            <input
              type="number"
              value={baselineWatts}
              onChange={(e) => setBaselineWatts(Number(e.target.value))}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              disabled={isRunning}
            />
          </div>
          
          <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Base Rate (K per Wh)
            </label>
            <input
              type="number"
              step="0.1"
              value={baseRate}
              onChange={(e) => setBaseRate(Number(e.target.value))}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              disabled={isRunning}
            />
          </div>
          
          <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Penalty Factor (Above Baseline)
            </label>
            <input
              type="number"
              step="0.1"
              value={penaltyFactor}
              onChange={(e) => setPenaltyFactor(Number(e.target.value))}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              disabled={isRunning}
            />
          </div>
          
          <div style={{ backgroundColor: '#fffbeb', padding: '16px', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Reward Factor (Below Baseline)
            </label>
            <input
              type="number"
              step="0.1"
              value={rewardFactor}
              onChange={(e) => setRewardFactor(Number(e.target.value))}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              disabled={isRunning}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
          <button
            onClick={() => setIsRunning(!isRunning)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: isRunning ? '#ef4444' : '#10b981',
              color: 'white'
            }}
          >
            {isRunning ? 'Pause Simulation' : 'Start Simulation'}
          </button>
          
          <button
            onClick={resetSimulation}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6b7280',
              color: 'white',
              borderRadius: '8px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
        </div>

        {/* Current Status */}
        <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
            Current Hour: {String(currentHour).padStart(2, '0')}:00
          </h3>
          
          {latestHourData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {households.map(household => {
                const consumption = latestHourData[`${household.id}_consumption`];
                const cost = latestHourData[`${household.id}_cost`];
                const isAboveBaseline = consumption > baselineWatts;
                
                return (
                  <div 
                    key={household.id}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${isAboveBaseline ? '#f87171' : '#34d399'}`,
                      backgroundColor: isAboveBaseline ? '#fef2f2' : '#f0fdf4'
                    }}
                  >
                    <h4 style={{ fontWeight: '600', color: '#1f2937' }}>{household.name}</h4>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>Usage: {consumption}W</p>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>Cost: K{cost.toFixed(2)}</p>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: isAboveBaseline ? '#dc2626' : '#059669'
                    }}>
                      {isAboveBaseline ? 'Above Baseline (Penalty)' : 'Below Baseline (Reward)'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Hourly Usage Chart */}
        {hourlyData.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
              Hourly Electricity Usage (Watts)
            </h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="A_consumption" 
                    stroke="#3B82F6" 
                    name="Household A"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="B_consumption" 
                    stroke="#EF4444" 
                    name="Household B"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="C_consumption" 
                    stroke="#10B981" 
                    name="Household C"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={() => baselineWatts} 
                    stroke="#6B7280" 
                    name="Baseline"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Daily Totals */}
        {dailyTotals.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                Daily Energy Consumption (kWh)
              </h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyTotals}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => [(value/1000).toFixed(1) + ' kWh', '']} />
                    <Bar dataKey="A_total" fill="#3B82F6" name="Household A" />
                    <Bar dataKey="B_total" fill="#EF4444" name="Household B" />
                    <Bar dataKey="C_total" fill="#10B981" name="Household C" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                Daily Cost (Kwacha)
              </h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyTotals}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => ['K' + value.toFixed(2), '']} />
                    <Bar dataKey="A_cost" fill="#3B82F6" name="Household A" />
                    <Bar dataKey="B_cost" fill="#EF4444" name="Household B" />
                    <Bar dataKey="C_cost" fill="#10B981" name="Household C" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Explanation */}
        <div style={{ marginTop: '24px', backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px' }}>
          <h3 style={{ fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>
            How the Dynamic Pricing Works:
          </h3>
          <ul style={{ fontSize: '14px', color: '#1e40af', margin: 0, paddingLeft: '20px' }}>
            <li><strong>Baseline Usage:</strong> Expected household consumption per hour ({baselineWatts}W)</li>
            <li><strong>Below Baseline:</strong> Households get rewarded with {((1-rewardFactor)*100).toFixed(0)}% discount</li>
            <li><strong>Above Baseline:</strong> Households pay {((penaltyFactor-1)*100).toFixed(0)}% penalty on excess usage</li>
            <li><strong>Real-time Feedback:</strong> Households see immediate cost impact of their usage</li>
            <li><strong>Conservation Incentive:</strong> Lower usage = lower bills, encouraging energy efficiency</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <ElectricityPricingSimulator />
    </div>
  );
}

export default App;