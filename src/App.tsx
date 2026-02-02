import { useState, useEffect } from 'react';
import { Droplets } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, generateId } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface Contraction {
  id: string;
  startTime: number;
  endTime: number | null;
}

function App() {
  const [contractions, setContractions] = useLocalStorage<Contraction[]>('contractions', []);
  
  const [activeContractionId, setActiveContractionId] = useLocalStorage<string | null>('activeContractionId', null);

  const [waterBreakTime, setWaterBreakTime] = useLocalStorage<number | null>('waterBreakTime', null);

  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    let interval: number;
    // Run timer if active, water break reported, or history exists (for "time since last")
    if (activeContractionId || waterBreakTime || contractions.length > 0) {
      interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000); // Keep 1s updates for smooth seconds display
    }
    return () => clearInterval(interval);
  }, [activeContractionId, waterBreakTime, contractions]);


  const activeContraction = activeContractionId 
    ? contractions.find(c => c.id === activeContractionId) 
    : null;

  const toggleContraction = () => {
    if (activeContractionId) {
      // Stop
      const now = Date.now();
      setContractions(prev => prev.map(c => 
        c.id === activeContractionId 
          ? { ...c, endTime: now } 
          : c
      ));
      setActiveContractionId(null);
      setCurrentTime(now); // Sync current time to prevent negative "time since" values
    } else {
      // Start
      const newId = generateId();
      const newContraction: Contraction = {
        id: newId,
        startTime: Date.now(),
        endTime: null,
      };
      setContractions(prev => [newContraction, ...prev]);
      setActiveContractionId(newId);
      setCurrentTime(Date.now());
    }
  };

  const toggleWaterBreak = () => {
    if (waterBreakTime) {
      if (confirm('האם לבטל את דיווח ירידת המים?')) {
        setWaterBreakTime(null);
      }
    } else {
      setWaterBreakTime(Date.now());
    }
  };

  const completedContractions = contractions.filter(c => c.endTime !== null);
  const lastCompleted = completedContractions.length > 0 ? completedContractions[0] : null;

  const formatDuration = (ms: number) => {
    // Prevent negative numbers which cause display glitches like "1-:1-"
    const safeMs = Math.max(0, ms);
    const totalSeconds = Math.floor(safeMs / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);
    
    // For very short durations (less than a minute), we still show 0:XX
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Current timer display (if active)
  const currentDuration = activeContraction ? currentTime - activeContraction.startTime : 0;

  // Last contraction stats (completed)
  const lastDuration = lastCompleted && lastCompleted.endTime ? lastCompleted.endTime - lastCompleted.startTime : 0;
  
  let timeSinceLastDisplay = "-";
  let lastDurationDisplay = "-";
  
  if (activeContraction) {
     const prev = contractions.length > 1 ? contractions[1] : null;
     if (prev) {
         const freqMs = activeContraction.startTime - prev.startTime;
         timeSinceLastDisplay = formatDuration(freqMs);
     }
      if (lastCompleted) {
          lastDurationDisplay = formatDuration(lastDuration);
      }
  } else {
     if (lastCompleted && lastCompleted.endTime) {
         lastDurationDisplay = formatDuration(lastDuration);
         const timeSinceEnd = currentTime - lastCompleted.endTime;
         timeSinceLastDisplay = formatDuration(timeSinceEnd);
     }
  }

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto pb-10 min-h-screen">
      <header className="pt-8 pb-8">
        <h1 className="text-3xl font-light tracking-tight text-foreground">תזמון צירים</h1>
      </header>
      
      <main className="w-full px-6 flex flex-col items-center">
        <div className="h-20 flex items-center justify-center mb-8 text-foreground">
             {activeContraction ? (
                 <div className="text-7xl font-bold tabular-nums text-primary animate-pulse-slow">
                     {formatDuration(currentDuration)}
                 </div>
             ) : (
                 <div className="text-2xl text-muted-foreground font-light">מוכנה לציר הבא?</div>
             )}
        </div>

        <Button 
            variant={activeContraction ? "outline" : "default"}
            size="xl"
            className={cn(
              "rounded-full border-4 mb-8 shadow-2xl relative overflow-hidden transition-all duration-500",
               activeContraction 
                ? "border-primary text-foreground hover:bg-red-50" 
                : "border-transparent bg-gradient-to-br from-primary to-primary/80 hover:scale-105 hover:shadow-primary/40"
            )}
            onClick={toggleContraction}
        >
            <span className="relative z-10 text-3xl font-medium">
              {activeContraction ? 'סיום ציר' : 'התחלת ציר'}
            </span>
        </Button>

        <div className="w-full flex justify-center mb-10">
          <Button
            variant={waterBreakTime ? "secondary" : "ghost"} 
            size="sm"
            onClick={toggleWaterBreak}
            className={cn(
              "rounded-full px-6 py-6 border transition-all duration-300",
               waterBreakTime 
               ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" 
               : "text-muted-foreground border-transparent hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600"
            )}
          >
            <Droplets className={cn("w-5 h-5 ml-2", waterBreakTime && "fill-blue-400 text-blue-500")} />
            {waterBreakTime ? (
               <div className="flex flex-col items-start leading-tight">
                  <span className="text-xs font-semibold">המים ירדו ב-{formatTime(waterBreakTime)}</span>
                  <span className="text-[10px] opacity-80">(לפני {formatDuration(currentTime - waterBreakTime)})</span>
               </div>
            ) : (
              <span>דיווח ירידת מים</span>
            )}
          </Button>
        </div>

        <Card className="w-full mb-12 border-none shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="flex justify-between items-center p-8">
              <div className="flex flex-col items-center flex-1">
                  <span className="text-sm font-medium text-muted-foreground mb-2">משך ציר אחרון</span>
                  <span className="text-3xl font-bold text-foreground tabular-nums">{lastDurationDisplay}</span>
              </div>
              <div className="w-px h-12 bg-border mx-4"></div>
              <div className="flex flex-col items-center flex-1">
                  <span className="text-sm font-medium text-muted-foreground mb-2">
                    {activeContraction ? 'תדירות (מקודם)' : 'זמן שעבר מהאחרון'}
                  </span>
                  <span className="text-3xl font-bold text-foreground tabular-nums">{timeSinceLastDisplay}</span>
              </div>
            </CardContent>
        </Card>

        <section className="w-full">
            <h2 className="text-lg font-medium text-muted-foreground mb-4">היסטוריה</h2>
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="text-right">התחלה</TableHead>
                            <TableHead className="text-right">סיום</TableHead>
                            <TableHead className="text-right">משך</TableHead>
                            <TableHead className="text-right">תדירות</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contractions.map((c, index) => {
                            const isFinished = c.endTime !== null;
                            const duration = isFinished && c.endTime ? c.endTime - c.startTime : (currentTime - c.startTime);

                            const prev = contractions[index + 1];
                            const frequency = prev ? (c.startTime - prev.startTime) : 0;
                            
                            return (
                                <TableRow key={c.id} className={cn(!isFinished && "bg-primary/5 animate-in fade-in transition-colors")}>
                                    <TableCell className="font-medium text-foreground">{formatTime(c.startTime)}</TableCell>
                                    <TableCell>{isFinished && c.endTime ? formatTime(c.endTime) : '...'}</TableCell>
                                    <TableCell className="font-bold tabular-nums">{formatDuration(duration)}</TableCell>
                                    <TableCell className="text-muted-foreground tabular-nums">{prev ? formatDuration(frequency) : '-'}</TableCell>
                                </TableRow>
                            );
                        })}
                        {contractions.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                              אין עדיין נתונים
                            </TableCell>
                          </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </section>
      </main>
    </div>
  );
}

export default App;
