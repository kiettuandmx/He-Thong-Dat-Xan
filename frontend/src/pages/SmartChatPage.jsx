import SmartChatBox from '../components/SmartChatBox';

const SmartChatPage = () => (
  <section className="container py-4">
    <div className="row justify-content-center">
      <div className="col-lg-9">
        <p className="eyebrow">Tro ly GraphRAG cho nguoi dat san</p>
        <h1 className="mb-3">Tro ly dat san thong minh</h1>
        <p className="text-muted mb-4">
          Nhap nhu cau cua ban de nhan 2-3 san goi y cung ly do vi sao tung lua chon phu hop.
        </p>
        <SmartChatBox />
      </div>
    </div>
  </section>
);

export default SmartChatPage;
