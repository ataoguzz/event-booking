import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserIcon, ClockIcon, DollarSignIcon, CheckIcon, XIcon, PencilIcon } from 'lucide-react'
import { Button } from "@/components/ui/button.jsx";
import { useState } from "react";
import { Input } from "@/components/ui/input.jsx";
import { APICore } from "@/helpers/apiCore.js";
import { toast } from "@/hooks/use-toast.js";

export default function DashboardOverview({ guides, hourlyRate, setHourlyRate }) {
  const { t } = useTranslation();
  const api = new APICore();

  const [isEditing, setIsEditing] = useState(false)
  const [newHourlyRate, setNewHourlyRate] = useState(hourlyRate)

  const totalGuides = guides.length
  const totalHours = guides.reduce((sum, guide) => sum + guide.monthlyLoggedHours, 0)
  const totalPayment = guides.reduce((sum, guide) => sum + guide.currentPayment, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post("/api/settings/updateHourlyRate", {
        hourlyRate: newHourlyRate
      })
      setHourlyRate(Number(newHourlyRate))
      setIsEditing(false)
    } catch (err) {
      toast({
        title: t('dashboardOverview.hourlyRate.toast.error.title'),
        description: t('dashboardOverview.hourlyRate.toast.error.description'),
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setNewHourlyRate(hourlyRate)
    setIsEditing(false)
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('guidesDashboard.stats.totalGuides')}</CardTitle>
          <UserIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalGuides}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('guidesDashboard.stats.totalHours')}</CardTitle>
          <ClockIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalHours}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('guidesDashboard.stats.totalPayment')}</CardTitle>
          <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPayment}TL</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('guidesDashboard.stats.hourlyRate')}</CardTitle>
          <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
              <Input
                type="number"
                value={newHourlyRate}
                onChange={(e) => setNewHourlyRate(e.target.value)}
                className="w-24 text-right"
                min="0"
                step="0.01"
                required
              />
              <Button type="submit" size="icon" variant="ghost">
                <CheckIcon className="h-4 w-4" />
                <span className="sr-only">{t('dashboardOverview.hourlyRate.save')}</span>
              </Button>
              <Button type="button" size="icon" variant="ghost" onClick={handleCancel}>
                <XIcon className="h-4 w-4" />
                <span className="sr-only">{t('dashboardOverview.hourlyRate.cancel')}</span>
              </Button>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{hourlyRate}TL</div>
              <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
                <PencilIcon className="h-4 w-4" />
                <span className="sr-only">{t('dashboardOverview.hourlyRate.update')}</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}