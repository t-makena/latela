export const MobileBudgetInsightCard = () => {
  return (
    <div className="animate-fade-in">
      <h2 className="text-base font-bold mb-3 font-georama text-black">Budget insight</h2>
      
      <div 
        className="bg-white rounded-3xl border border-black p-4 min-h-[400px]"
        style={{ boxShadow: '3px 3px 0px #000000' }}
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E0E0E0]">
              <th className="text-left font-normal text-sm text-[#999999] pb-4">Metric</th>
              <th className="text-right font-normal text-sm text-[#999999] pb-4">
                1 Mth Chng ▼
              </th>
            </tr>
          </thead>
          <tbody>
            {/* 3 empty rows with gray dividers */}
            <tr className="border-b border-[#E0E0E0]">
              <td className="py-10"></td>
              <td className="py-10"></td>
            </tr>
            <tr className="border-b border-[#E0E0E0]">
              <td className="py-10"></td>
              <td className="py-10"></td>
            </tr>
            <tr>
              <td className="py-10"></td>
              <td className="py-10"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
