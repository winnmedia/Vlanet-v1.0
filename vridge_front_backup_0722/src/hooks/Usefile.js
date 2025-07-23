import { useState } from 'react'

const useFile = (initialValue) => {
  const [files, set_files] = useState(initialValue)
  const FileChange = (event) => {
    const onfiles = event.target.files
    set_files([...files, ...Array.from(onfiles)])
    event.target.value = ''
  }
  const FileDelete = (index) => {
    const newFile = [...files]
    newFile.splice(index, 1)
    set_files(newFile)
  }
  return { files, FileChange, FileDelete }
}

export default useFile
