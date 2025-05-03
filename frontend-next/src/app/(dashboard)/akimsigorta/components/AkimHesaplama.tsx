'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Zap, Calculator, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

// Form şeması
const formSchema = z.object({
  guc: z.coerce.number().min(1, {
    message: 'Güç değeri en az 1 watt olmalıdır',
  }),
  sistemTipi: z.enum(['trifaze', 'monofaze']),
  cosq: z.coerce.number().min(0.1).max(1).optional().default(0.95),
});

type FormValues = z.infer<typeof formSchema>;

interface AkimHesaplamaProps {
  onAkimHesaplandi: (akimDegeri: number, sistemTipi: 'trifaze' | 'monofaze') => void;
}

export default function AkimHesaplama({ onAkimHesaplandi }: AkimHesaplamaProps) {
  const [hesaplananAkim, setHesaplananAkim] = useState<number | null>(null);
  const [cosqDegeri, setCosqDegeri] = useState<number>(0.95);

  // Form tanımı
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      guc: 1000,
      sistemTipi: 'trifaze',
      cosq: 0.95,
    },
  });

  // Sistem tipi değişikliğini dinleyelim
  const sistemTipi = form.watch('sistemTipi');

  useEffect(() => {
    // cosq slider değerini güncelleyelim
    setCosqDegeri(form.getValues('cosq') || 0.95);
  }, [form]);

  // Akım hesaplama işlemi
  const hesaplaAkim = (values: FormValues) => {
    const { guc, sistemTipi, cosq } = values;
    let akimDegeri: number;
    
    if (sistemTipi === 'trifaze') {
      // Trifaze formülü: I = P / (1.73 * 380 * Cosφ)
      akimDegeri = guc / (1.73 * 380 * (cosq || 0.95));
    } else {
      // Monofaze formülü: I = P / 220
      akimDegeri = guc / 220;
    }
    
    // Akım değerini 2 ondalık basamakla yuvarla
    akimDegeri = parseFloat(akimDegeri.toFixed(2));
    
    setHesaplananAkim(akimDegeri);
    onAkimHesaplandi(akimDegeri, sistemTipi);
    
    toast.success(`Akım değeri hesaplandı: ${akimDegeri} A`);
  };

  // Formu sıfırlama
  const resetForm = () => {
    form.reset({
      guc: 1000,
      sistemTipi: 'trifaze',
      cosq: 0.95,
    });
    setHesaplananAkim(null);
    setCosqDegeri(0.95);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="mr-2 h-5 w-5" />
          Akım Hesaplama
        </CardTitle>
        <CardDescription>
          Elektrik güç değerine göre akım hesaplayın
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(hesaplaAkim)} className="space-y-6">
            <FormField
              control={form.control}
              name="sistemTipi"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Sistem Tipi</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-4"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="trifaze" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Trifaze (380V)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="monofaze" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Monofaze (220V)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Güç (Watt)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Güç değerini girin" {...field} />
                  </FormControl>
                  <FormDescription>
                    Elektrik gücünü watt cinsinden girin
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {sistemTipi === 'trifaze' && (
              <FormField
                control={form.control}
                name="cosq"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Güç Faktörü (Cosφ): {cosqDegeri}</FormLabel>
                    <FormControl>
                      <Slider
                        defaultValue={[field.value || 0.95]}
                        min={0.1}
                        max={1}
                        step={0.01}
                        onValueChange={(vals) => {
                          setCosqDegeri(vals[0]);
                          field.onChange(vals[0]);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Trifaze sistemlerde güç faktörü (Cosφ) değerini belirleyin
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button type="submit" className="w-full sm:w-auto">
                <Calculator className="mr-2 h-4 w-4" />
                Akım Hesapla
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto">
                <RotateCcw className="mr-2 h-4 w-4" />
                Sıfırla
              </Button>
            </div>
          </form>
        </Form>

        {hesaplananAkim !== null && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <h3 className="text-lg font-semibold mb-2 flex items-center justify-center">
              <Zap className="mr-2 h-6 w-6 text-amber-500" />
              Hesaplanan Akım Değeri
            </h3>
            <div className="text-center">
              <span className="text-3xl font-bold">{hesaplananAkim} A</span>
              <p className="mt-2 text-muted-foreground text-sm">
                {sistemTipi === 'trifaze' 
                  ? `Trifaze sistem için ${form.getValues('guc')} Watt güçte, Cosφ=${cosqDegeri} değerinde hesaplanan akım` 
                  : `Monofaze sistem için ${form.getValues('guc')} Watt güçte hesaplanan akım`}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 