import { Checkbox, Stack, Text } from "@chakra-ui/react";
import Layout from "../../components/layout";
import { useUser } from "../../UserContext";
import { useState } from "react";

function QuizHQRP(){
    const { userProfile } = useUser(); 

    const initialValues = [
        { label: "BLI - 5", checked: false, value: "bli5" },
        { label: "BLI - 6", checked: false, value: "bli6" },
        { label: "Menara BCA", checked: false, value: "menarabca" },
        { label: "Asemka", checked: false, value: "asemka" },
        { label: "WSA 1", checked: false, value: "wsa1" },
        { label: "WSA 2", checked: false, value: "wsa2" },
    ]

    const [values, setValues] = useState(initialValues)
      
    const allChecked = values.every((value) => value.checked)
    const indeterminate = values.some((value) => value.checked) && !allChecked
      
    const items = values.map((item, index) => (
          <Checkbox.Root
            ms="6"
            key={item.value}
            checked={item.checked}
            onCheckedChange={(e) => {
              setValues((current) => {
                const newValues = [...current]
                newValues[index] = { ...newValues[index], checked: !!e.checked }
                return newValues
              })
            }}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>{item.label}</Checkbox.Label>
          </Checkbox.Root>
    ))
      
    
    return(
        <Layout>
            <Text marginTop={"20px"} fontWeight={"bold"} fontSize={"2xl"} >Hi, {userProfile?.DisplayName}</Text>

            <Stack marginTop={"50px"} align="flex-start">
                <Checkbox.Root
                    checked={indeterminate ? "indeterminate" : allChecked}
                    onCheckedChange={(e) => {
                    setValues((current) =>
                        current.map((value) => ({ ...value, checked: !!e.checked })),
                    )
                    }}
                >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control>
                    <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Checkbox.Label>Lokasi Kerja</Checkbox.Label>
                </Checkbox.Root>
                {items}
                </Stack>
        </Layout>
    );
}

export default QuizHQRP;