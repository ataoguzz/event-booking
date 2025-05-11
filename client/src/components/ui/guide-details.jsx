import {useState, useEffect} from 'react'
import {useTranslation} from 'react-i18next';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {UserIcon, ClockIcon, DollarSignIcon} from 'lucide-react'
import {APICore} from "@/helpers/apiCore.js";
import {toast} from "@/hooks/use-toast.js";

export default function GuideDetails({guide, hourlyRate}) {
    const {t} = useTranslation();
    const api = new APICore();
    const [history, setHistory] = useState([])
    const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const newDate = new Date();
    useEffect(() => {
        fetchGuideHistory(guide._id)
    }, [guide._id])

    const fetchGuideHistory = async (guideId) => {
        try {
            const response = await api.get(`/api/guides/getGuideMonthlyPaymentHistory/${guideId}`)
            const guideHistory = response.data.monthlyLoggedHours;
            setHistory(guideHistory);
        } catch (error) {
            toast({
                title: t('guideDetails.toast.error.title'),
                description: t('guideDetails.toast.error.description'),
                variant: "destructive",
            })
        }
    }


    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <div className="rounded-full bg-primary/10 p-3">
                    <UserIcon className="h-6 w-6 text-primary"/>
                </div>
                <h2 className="text-2xl font-bold">{guide.first_name + " " + guide.last_name}</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('guideDetails.workInfo.monthlyHours')}</CardTitle>
                        <ClockIcon className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{guide.monthlyLoggedHours}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('guideDetails.workInfo.currentPayment')}</CardTitle>
                        <DollarSignIcon className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{guide.currentPayment}TL</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('guideDetails.paymentHistory.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('guideDetails.paymentHistory.month')}</TableHead>
                                <TableHead>{t('guideDetails.paymentHistory.year')}</TableHead>
                                <TableHead>{t('guideDetails.paymentHistory.hoursLogged')}</TableHead>
                                <TableHead>{t('guideDetails.paymentHistory.payment')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>{
                            history.length !== 0 ? history.map((entry, index) => (
                            <TableRow key={index}>
                                <TableCell>{month[entry.month]}</TableCell>
                                <TableCell>{entry.year}</TableCell>
                                <TableCell>{entry.hours}</TableCell>
                                <TableCell>{entry.monthlyPayment}TL</TableCell>
                            </TableRow>
                        )) :
                            <TableRow >
                                <TableCell colSpan={4} className="text-center text-gray-500">
                                    {t('guideDetails.paymentHistory.noHistory')}
                                </TableCell>
                            </TableRow>
                        }
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}