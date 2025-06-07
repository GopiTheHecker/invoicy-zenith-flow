
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useInvoice } from '@/contexts/InvoiceContext';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

const Reports = () => {
  const { invoices } = useInvoice();

  // Generate monthly revenue data for the last 6 months
  const monthlyData = React.useMemo(() => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    return last6Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthlyInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.issue_date);
        return invoiceDate >= monthStart && invoiceDate <= monthEnd;
      });

      const revenue = monthlyInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
      const count = monthlyInvoices.length;

      return {
        month: format(month, 'MMM yyyy'),
        revenue: revenue,
        invoices: count
      };
    });
  }, [invoices]);

  // Status distribution data
  const statusData = React.useMemo(() => {
    const statusCounts = invoices.reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      value: count
    }));
  }, [invoices]);

  // Calculate totals
  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const totalInvoices = invoices.length;
  const avgInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
  const pendingInvoices = invoices.filter(invoice => invoice.status === 'pending').length;

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "#2563eb",
    },
    invoices: {
      label: "Invoices",
      color: "#60a5fa",
    },
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Invoice Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{avgInvoiceValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvoices}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
            <CardDescription>Revenue and invoice count over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="var(--color-revenue)" 
                  strokeWidth={2}
                  name="Revenue (₹)"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Invoice Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status Distribution</CardTitle>
            <CardDescription>Breakdown of invoices by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {statusData.map((entry, index) => (
                <div key={entry.status} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-sm">{entry.status}: {entry.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Invoice Count */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Invoice Count</CardTitle>
            <CardDescription>Number of invoices created each month</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="invoices" 
                  fill="var(--color-invoices)" 
                  name="Invoice Count"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Revenue generated each month</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="revenue" 
                  fill="var(--color-revenue)" 
                  name="Revenue (₹)"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
