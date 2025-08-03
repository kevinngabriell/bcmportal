import { Menu, type MenuProps } from "antd";
import { useNavigate } from "react-router-dom";
import { Typography } from "antd";
import { FiAlertTriangle, FiRepeat, FiShield } from "react-icons/fi";

const { Title } = Typography;

type MenuItem = Required<MenuProps>["items"][number];

const items: MenuItem[] = [
  {
    key: "BC",
    label: "Business Continuity",
    icon: <FiRepeat />
  },
  {
    key: "CM",
    label: "Crisis Management",
    icon: <FiAlertTriangle />,
    // children: [
    //   { key: "QuizHQRP", label: "Quiz HQRP"}
    // ]
  },
  {
    key: "K3",
    label: "K3",
    icon: <FiShield />,
    children: [
      { key: "SelfSurveyAreaKerjaK3", label: "Self Survey Area Kerja K3" },
      { key: "SelfSurveyPeralatanK3", label: "Self Survey Peralatan K3" },
    ],
  }
];

function NavBar() {
    const navigate = useNavigate();

    const handleMenuClick: MenuProps["onClick"] = (e) => {
        if (e.key === "SelfSurveyAreaKerjaK3") {
            navigate("/K3/SelfSurveyAreaKerja");
        } else if (e.key === "BC") {
            navigate("/BC");
        } else if (e.key === "CM") {
            navigate("/CM");
        } else if (e.key === "SelfSurveyPeralatanK3") {
            navigate("/K3/SelfSurveyPeralatan");
        } else if (e.key === "QuizHQRP"){
          navigate("/CM/QuizHQRP");
        }
    };

    const handleHomepageClick = () => {
        navigate('/');
    }

    return (
    <div
      style={{
        width: 256,
        height: "100vh",
        borderRight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* BCM Portal Title */}
      <div style={{ marginBottom:"20px", padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
        <Title level={4} style={{ margin: 0 }} onClick={handleHomepageClick}>
          BCM Portal
        </Title>
      </div>

      {/* Ant Design Menu */}
      <Menu
        mode="inline"
        defaultSelectedKeys={["1"]}
        defaultOpenKeys={["sub4"]}
        style={{ flex: 1 }}
        items={items}
        onClick={handleMenuClick}
      />
    </div>
  );
}

export default NavBar;