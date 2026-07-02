// components/mobile/ShippingCalculator.tsx
import { Card, Slider, Switch } from 'antd';
import { useState } from 'react';

export function MobileShippingCalculator() {
  const [weight, setWeight] = useState(2);
  const [value, setValue] = useState(100);
  const [isInternational, setIsInternational] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  
  const calculateShipping = () => {
    let rate = isPremium ? 8 : (isInternational ? 5 : 2.5);
    let baseShipping = weight * rate;
    
    // Insurance (2% of value)
    const insurance = value * 0.02;
    
    // Handling (1% of value)
    const handling = value * 0.01;
    
    // Packaging
    const packaging = 5;
    
    // Total
    const total = baseShipping + insurance + handling + packaging;
    
    return { baseShipping, insurance, handling, packaging, total };
  };
  
  const result = calculateShipping();
  
  return (
    <div className="p-4 max-w-md mx-auto">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Shipping Calculator</h2>
        
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium">Weight (kg)</label>
            <Slider 
              value={weight} 
              onChange={setWeight}
              max={100}
              step={0.5}
            />
            <div className="flex justify-between text-sm">
              <span>0kg</span>
              <span>{weight}kg</span>
              <span>100kg</span>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Order Value ($)</label>
            <Slider 
              value={value} 
              onChange={setValue}
              max={1000}
              step={10}
            />
            <div className="flex justify-between text-sm">
              <span>$0</span>
              <span>${value}</span>
              <span>$1000</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">International Shipping</label>
            <Switch 
              checked={isInternational}
              onChange={setIsInternational}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Premium Service</label>
            <Switch 
              checked={isPremium}
              onChange={setIsPremium}
            />
          </div>
          
          {value >= 100 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">🎉 Free shipping eligible!</p>
              {isPremium && (
                <p className="text-sm text-green-600">Premium customer discount applied</p>
              )}
            </div>
          )}
          
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Base Shipping:</span>
              <span>${result.baseShipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Insurance:</span>
              <span>${result.insurance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Handling:</span>
              <span>${result.handling.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Packaging:</span>
              <span>${result.packaging.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total:</span>
              <span>${result.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
