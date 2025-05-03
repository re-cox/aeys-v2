"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CircuitType, VoltageDropInput, VoltageDropResult } from "@/types/voltageDrop";
import { calculateVoltageDrop } from "@/services/voltageDropService";
import { AlertCircle, Zap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function VoltageDropForm() {
  const [input, setInput] = useState<VoltageDropInput>({
    circuitType: 'TRIFAZE',
    distance: 0,
    power: 0,
    conductorSection: 0,
    conductorType: 'COPPER'
  });

  const [result, setResult] = useState<VoltageDropResult | null>(null);
  const [error, setError] = useState<string>("");

  const handleInputChange = (field: keyof VoltageDropInput, value: any) => {
    setInput(prev => ({
      ...prev,
      [field]: field === 'circuitType' || field === 'conductorType' ? value : Number(value)
    }));
  };

  const handleCalculate = () => {
    // Validasyon
    if (input.distance <= 0 || input.power <= 0 || input.conductorSection <= 0) {
      setError("Lütfen tüm alanları doğru şekilde doldurunuz.");
      return;
    }

    setError("");
    const calculationResult = calculateVoltageDrop(input);
    setResult(calculationResult);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-xl font-bold">Gerilim Düşümü Hesaplama</CardTitle>
        <CardDescription className="text-center">
          Trifaze ve monofaze sistemler için gerilim düşümü hesaplaması yapabilirsiniz.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="circuitType">Devre Tipi</Label>
            <Select
              value={input.circuitType}
              onValueChange={(value: CircuitType) => handleInputChange('circuitType', value)}
            >
              <SelectTrigger id="circuitType">
                <SelectValue placeholder="Devre tipini seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRIFAZE">Trifaze (380V)</SelectItem>
                <SelectItem value="MONOFAZE">Monofaze (220V)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conductorType">İletken Tipi</Label>
            <Select
              value={input.conductorType}
              onValueChange={(value) => handleInputChange('conductorType', value)}
            >
              <SelectTrigger id="conductorType">
                <SelectValue placeholder="İletken tipini seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COPPER">Bakır</SelectItem>
                <SelectItem value="ALUMINUM">Alüminyum</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="distance">Hat Mesafesi (metre)</Label>
            <Input
              id="distance"
              type="number"
              min="0"
              value={input.distance || ''}
              onChange={(e) => handleInputChange('distance', e.target.value)}
              placeholder="Örn: 15"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="power">Güç (kW)</Label>
            <Input
              id="power"
              type="number"
              min="0"
              step="0.1"
              value={input.power || ''}
              onChange={(e) => handleInputChange('power', e.target.value)}
              placeholder="Örn: 8"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conductorSection">İletken Kesiti (mm²)</Label>
            <Input
              id="conductorSection"
              type="number"
              min="0"
              step="0.5"
              value={input.conductorSection || ''}
              onChange={(e) => handleInputChange('conductorSection', e.target.value)}
              placeholder="Örn: 6"
            />
          </div>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Hesaplama Sonucu</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className={`text-2xl font-bold ${result.isAcceptable ? 'text-green-600' : 'text-red-600'}`}>
                  %{result.voltageDropPercentage.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium">Kullanılan Formül:</p>
              <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                {result.formula}
              </p>
            </div>
            {!result.isAcceptable && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Dikkat</AlertTitle>
                <AlertDescription>
                  Hesaplanan gerilim düşümü %3'ten fazla! Bu değer standartlara uygun değildir.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleCalculate} 
          className="w-full" 
          size="lg"
          variant="default"
        >
          <Zap className="mr-2 h-4 w-4" /> Hesapla
        </Button>
      </CardFooter>
    </Card>
  );
}