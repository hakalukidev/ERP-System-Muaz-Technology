"use client";

import { useCollection } from "@/lib/hooks/useFirebase";
import { Transaction } from "@/types/transaction";
import { Card, Col, Row, Statistic } from "antd";

export function IncomeExpenseTracker() {
  const { data: transactions } = useCollection<Transaction>('transactions');
  
  const totalIncome = transactions
    ?.filter((t: Transaction) => t.type === 'income')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0) || 0;
    
  const totalExpense = transactions
    ?.filter((t: Transaction) => t.type === 'expense')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0) || 0;
    
  const profit = totalIncome - totalExpense;
  
  return (
    <Card title="Financial Overview">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Statistic title="Total Income" prefix="$" value={totalIncome} precision={2} />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="Total Expense" prefix="$" value={totalExpense} precision={2} />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="Net Profit/Loss" prefix="$" value={profit} precision={2} />
        </Col>
      </Row>
    </Card>
  );
}
