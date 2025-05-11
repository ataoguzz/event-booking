import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export default function GuideList({ guides, onSelectGuide }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('guideList.table.name')}</TableHead>
            <TableHead>{t('guideList.table.monthlyHours')}</TableHead>
            <TableHead>{t('guideList.table.payment')}</TableHead>
            <TableHead className="text-center">{t('applicationList.tableHeaders.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guides.map((guide) => (
            <TableRow key={guide._id}>
              <TableCell className="font-medium">{guide.first_name + " " + guide.last_name}</TableCell>
              <TableCell>{guide.monthlyLoggedHours}</TableCell>
              <TableCell>{guide.currentPayment}TL</TableCell>
              <TableCell>
                <Button variant="ghost" onClick={() => onSelectGuide(guide)}>{t('guidesDashboard.details.title')}</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}