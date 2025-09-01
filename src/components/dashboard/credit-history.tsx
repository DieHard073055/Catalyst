import { createSupabaseServer } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditTransaction } from '@/lib/types'

interface CreditHistoryProps {
  userId: string
  limit?: number
}

export default async function CreditHistory({ userId, limit = 10 }: CreditHistoryProps) {
  const supabase = await createSupabaseServer()
  
  const query = supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (limit) {
    query.limit(limit)
  }
  
  const { data: transactions, error } = await query

  if (error) {
    console.error('Error fetching credit transactions:', error)
    return <div className="text-red-500">Error loading transaction history</div>
  }

  if (!transactions?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit History</CardTitle>
          <CardDescription>Your credit transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No transactions yet</p>
        </CardContent>
      </Card>
    )
  }

  const getTransactionBadge = (type: string, amount: number) => {
    switch (type) {
      case 'grant':
        return <Badge className="bg-green-100 text-green-800">+{amount} Granted</Badge>
      case 'usage':
        return <Badge variant="destructive">-{Math.abs(amount)} Used</Badge>
      case 'adjustment':
        return <Badge variant="secondary">{amount > 0 ? '+' : ''}{amount} Adjusted</Badge>
      case 'refund':
        return <Badge className="bg-blue-100 text-blue-800">+{amount} Refunded</Badge>
      default:
        return <Badge variant="outline">{amount}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit History</CardTitle>
        <CardDescription>Your recent credit transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Feature</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="text-sm">
                  {new Date(transaction.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>
                <TableCell>
                  {getTransactionBadge(transaction.transaction_type, transaction.amount)}
                </TableCell>
                <TableCell className="font-mono">
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                </TableCell>
                <TableCell className="text-sm">
                  {transaction.feature_used || '-'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {transaction.admin_notes || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}