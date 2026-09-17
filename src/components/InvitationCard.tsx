import { motion } from "framer-motion";
import "./InvitationCard.css";

interface InvitationCardProps {
  onOpen: () => void;
}

const InvitationCard = ({ onOpen }: InvitationCardProps) => {
  return (
    <motion.div
      className="invitation-card-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="invitation-card"
        onClick={onOpen}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
      >
        <div className="card-cover">
          <div className="card-border">
            <div className="card-content">
              <p className="small-text">With the blessings of</p>

              <h1>Our Families</h1>

              <div className="om-symbol">ॐ</div>

              <h2>Wedding Invitation</h2>

              <p className="tap-text">
                Tap to Open
              </p>

              <span className="tap-icon">✦</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InvitationCard;