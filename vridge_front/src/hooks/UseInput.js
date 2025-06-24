import { useState } from 'react'

const useInput = (initialValue, validator) => {
  const [inputs, set_inputs] = useState(initialValue)
  const onChange = (event) => {
    const { name, value } = event.target
    let willUpdate = true
    if (typeof validator == 'function' && name != 'description') {
      willUpdate = validator(value)
    }
    if (willUpdate) {
      set_inputs({
        ...inputs,
        [name]: value,
      })
    }
  }
  return { inputs, onChange, set_inputs }
}

export default useInput
