const SmartChatPage = () => (
  <section className="smart-chat-page">
    <div className="smart-chat-layout">
      <div className="smart-chat-copy">
        <p className="eyebrow smart-chat-copy__eyebrow">Trợ lý GraphRAG cho người đặt sân</p>
        <h1 className="smart-chat-copy__title">Chatbox tư vấn sân theo kiểu hội thoại thời gian thực</h1>
        <p className="smart-chat-copy__lead">
          Mô tả nhu cầu như bạn đang nhắn tin với một trợ lý thật sự. Hệ thống sẽ đọc ý định,
          truy vấn graph dữ liệu, rồi trả lời theo dạng streaming để bạn thấy được kết quả ngay khi đang sinh.
        </p>
        <div className="smart-chat-copy__list">
          <div className="smart-chat-copy__pill">
            <span className="smart-chat-copy__bullet">1</span>
            Hiểu khu vực, môn thể thao, số người và mức giá mong muốn
          </div>
          <div className="smart-chat-copy__pill">
            <span className="smart-chat-copy__bullet">2</span>
            Phản hồi dạng tin nhắn, không cần chờ xong một cục mới hiện
          </div>
          <div className="smart-chat-copy__pill">
            <span className="smart-chat-copy__bullet">3</span>
            Gợi ý sân phù hợp kèm lý do rõ ràng, bám sát dữ liệu thật
          </div>
        </div>

        <div className="smart-chat-copy__hint">
          <span className="smart-chat-copy__hint-icon">S</span>
          <div>
            Bong bóng chat hiện ở góc phải dưới trên toàn bộ website. Bấm vào đó để mở khung trợ lý.
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default SmartChatPage;
